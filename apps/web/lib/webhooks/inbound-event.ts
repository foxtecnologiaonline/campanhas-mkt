import type { ChannelCredentials, ChannelProvider, InboundEvent } from "@campanhas-mkt/channel-providers";
import { getServiceRoleClient } from "@/lib/supabase/service-client";

type ServiceClient = ReturnType<typeof getServiceRoleClient>;

export interface ResolvedConnection {
  id: string;
  organization_id: string;
}

/**
 * Resolve o tenant pelo identificador que o próprio provider usa pra
 * distinguir instâncias (phone_number_id na Cloud API, nome da instância na
 * Evolution API) — nunca por um campo que a chamada declare ser o
 * organization_id. Compartilhado pelos dois webhook receivers para que essa
 * regra de segurança não possa divergir entre eles.
 */
export async function resolveChannelConnection(
  supabase: ServiceClient,
  provider: string,
  externalRef: string,
): Promise<ResolvedConnection | null> {
  const { data } = await supabase
    .from("channel_connections")
    .select("id, organization_id")
    .eq("provider", provider)
    .eq("external_ref", externalRef)
    .maybeSingle();

  return data as ResolvedConnection | null;
}

// Correspondência exata (após trim/lowercase), não substring — uma frase
// comprida que só cite a palavra "parar" não deve descadastrar ninguém.
const OPT_OUT_KEYWORDS = new Set(["sair", "parar", "cancelar", "stop", "descadastrar"]);

function isOptOutMessage(text: string | undefined): boolean {
  if (!text) return false;
  return OPT_OUT_KEYWORDS.has(text.trim().toLowerCase());
}

/**
 * Deduplica por (provider, provider_event_id) — os dois providers reentregam
 * webhooks — e aplica o efeito (status de mensagem ou registro de mensagem
 * inbound + conversa). Chamar só depois que a assinatura/apikey do provider
 * já foi verificada.
 */
export async function processInboundEvent(
  supabase: ServiceClient,
  channelProvider: ChannelProvider,
  connection: ResolvedConnection,
  event: InboundEvent,
): Promise<void> {
  const { data: inserted } = await supabase
    .from("webhook_events")
    .insert({
      provider: channelProvider.provider,
      provider_event_id: event.providerEventId,
      organization_id: connection.organization_id,
      payload: event.raw as object,
    })
    .select("id")
    .maybeSingle();

  if (!inserted) {
    // Conflito de unicidade: já processado.
    return;
  }

  if (event.type === "status" && event.providerMessageId && event.status) {
    await supabase
      .from("messages")
      .update({ status: event.status })
      .eq("organization_id", connection.organization_id)
      .eq("provider_message_id", event.providerMessageId);
    return;
  }

  if (event.type === "message" && event.contactExternalId) {
    await recordInboundMessage(supabase, channelProvider, connection, event);
  }
}

async function recordInboundMessage(
  supabase: ServiceClient,
  channelProvider: ChannelProvider,
  connection: ResolvedConnection,
  event: InboundEvent,
): Promise<void> {
  const organizationId = connection.organization_id;
  const externalId = event.contactExternalId as string;

  let { data: contactChannel } = await supabase
    .from("contact_channels")
    .select("id, contact_id")
    .eq("organization_id", organizationId)
    .eq("channel", "whatsapp")
    .eq("external_id", externalId)
    .maybeSingle();

  if (!contactChannel) {
    const { data: contact } = await supabase
      .from("contacts")
      .insert({ organization_id: organizationId })
      .select("id")
      .single();

    const { data: newChannel } = await supabase
      .from("contact_channels")
      .insert({
        organization_id: organizationId,
        contact_id: contact!.id,
        channel: "whatsapp",
        external_id: externalId,
      })
      .select("id, contact_id")
      .single();

    contactChannel = newChannel;
  }

  if (!contactChannel) return;

  await supabase.from("conversations").upsert(
    {
      organization_id: organizationId,
      contact_id: contactChannel.contact_id,
      channel: "whatsapp",
      last_message_at: (event.occurredAt ?? new Date()).toISOString(),
    },
    { onConflict: "organization_id,contact_id,channel" },
  );

  await supabase.from("messages").insert({
    organization_id: organizationId,
    contact_id: contactChannel.contact_id,
    channel: "whatsapp",
    direction: "inbound",
    provider_message_id: event.providerMessageId,
    status: "delivered",
    body: event.text,
  });

  if (isOptOutMessage(event.text)) {
    await handleOptOut(supabase, channelProvider, connection, contactChannel, externalId);
  }
}

async function handleOptOut(
  supabase: ServiceClient,
  channelProvider: ChannelProvider,
  connection: ResolvedConnection,
  contactChannel: { id: string; contact_id: string },
  externalId: string,
): Promise<void> {
  await supabase
    .from("contact_channels")
    .update({ opt_in: false, opt_out_at: new Date().toISOString() })
    .eq("id", contactChannel.id);

  await supabase.from("audit_log").insert({
    organization_id: connection.organization_id,
    actor_type: "system",
    action: "opt_out_via_message",
    payload: { contact_id: contactChannel.contact_id, channel: "whatsapp" },
  });

  // Confirmação de texto livre: estamos dentro da janela de sessão porque o
  // contato acabou de mandar mensagem, então não esbarra na exigência de
  // template da Cloud API fora da janela de 24h.
  try {
    const { data: credentials } = await supabase.rpc("get_channel_credentials", {
      p_connection_id: connection.id,
    });
    if (!credentials) return;

    await channelProvider.send(credentials as ChannelCredentials, {
      to: externalId,
      text: "Você foi removido(a) da nossa lista de envios. Se mudar de ideia, é só mandar mensagem de novo.",
      idempotencyKey: `opt-out-confirmation:${connection.id}:${externalId}`,
    });
  } catch (error) {
    console.error("falha ao enviar confirmação de opt-out", error);
  }
}

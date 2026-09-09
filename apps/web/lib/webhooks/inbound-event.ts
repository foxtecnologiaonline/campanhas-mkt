import type { InboundEvent } from "@campanhas-mkt/channel-providers";
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

/**
 * Deduplica por (provider, provider_event_id) — os dois providers reentregam
 * webhooks — e aplica o efeito (status de mensagem ou registro de mensagem
 * inbound + conversa). Chamar só depois que a assinatura/apikey do provider
 * já foi verificada.
 */
export async function processInboundEvent(
  supabase: ServiceClient,
  provider: string,
  organizationId: string,
  event: InboundEvent,
): Promise<void> {
  const { data: inserted } = await supabase
    .from("webhook_events")
    .insert({
      provider,
      provider_event_id: event.providerEventId,
      organization_id: organizationId,
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
      .eq("organization_id", organizationId)
      .eq("provider_message_id", event.providerMessageId);
    return;
  }

  if (event.type === "message" && event.contactExternalId) {
    await recordInboundMessage(supabase, organizationId, event);
  }
}

async function recordInboundMessage(
  supabase: ServiceClient,
  organizationId: string,
  event: InboundEvent,
): Promise<void> {
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
}

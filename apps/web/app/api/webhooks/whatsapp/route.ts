import { whatsAppCloudProvider, type InboundEvent } from "@campanhas-mkt/channel-providers";
import { getServiceRoleClient } from "@/lib/supabase/service-client";

/**
 * GET: handshake de assinatura do webhook exigido pela Meta ao configurar a
 * URL no App Dashboard. Documentação: developers.facebook.com/docs/graph-api/webhooks/getting-started
 */
export function GET(request: Request): Response {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN && challenge) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("forbidden", { status: 403 });
}

/**
 * POST: eventos de status e mensagens recebidas. A ordem importa:
 * 1. verificar assinatura sobre o corpo cru, antes de qualquer parse/consulta;
 * 2. resolver o tenant pelo phone_number_id do payload — nunca por um campo
 *    que a própria chamada declare ser o organization_id;
 * 3. deduplicar por provider_event_id, porque a Meta reentrega webhooks.
 */
export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("x-hub-signature-256");
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  if (!appSecret) {
    console.error("WHATSAPP_APP_SECRET não configurado");
    return new Response("server misconfigured", { status: 500 });
  }

  const validSignature = whatsAppCloudProvider.verifyWebhookSignature({
    rawBody,
    signatureHeader,
    appSecret,
  });

  if (!validSignature) {
    return new Response("invalid signature", { status: 401 });
  }

  const events = whatsAppCloudProvider.parseWebhookPayload(JSON.parse(rawBody));
  const supabase = getServiceRoleClient();

  for (const event of events) {
    await processEvent(supabase, event);
  }

  // A Meta espera 200 rápido; reentrega automaticamente em caso de erro/timeout.
  return new Response("ok", { status: 200 });
}

async function processEvent(
  supabase: ReturnType<typeof getServiceRoleClient>,
  event: InboundEvent,
): Promise<void> {
  const { data: connection } = await supabase
    .from("channel_connections")
    .select("organization_id")
    .eq("provider", "whatsapp_cloud")
    .eq("external_ref", event.externalRef)
    .maybeSingle();

  if (!connection) {
    console.warn(`webhook whatsapp: nenhuma conexão para phone_number_id=${event.externalRef}`);
    return;
  }

  const organizationId = connection.organization_id as string;

  const { data: inserted } = await supabase
    .from("webhook_events")
    .insert({
      provider: "whatsapp_cloud",
      provider_event_id: event.providerEventId,
      organization_id: organizationId,
      payload: event.raw as object,
    })
    .select("id")
    .maybeSingle();

  if (!inserted) {
    // Conflito de unicidade (provider, provider_event_id): já processado.
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
  supabase: ReturnType<typeof getServiceRoleClient>,
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

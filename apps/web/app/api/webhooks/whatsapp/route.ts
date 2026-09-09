import { whatsAppCloudProvider } from "@campanhas-mkt/channel-providers";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import { processInboundEvent, resolveChannelConnection } from "@/lib/webhooks/inbound-event";

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
    const connection = await resolveChannelConnection(supabase, "whatsapp_cloud", event.externalRef);
    if (!connection) {
      console.warn(`webhook whatsapp cloud: nenhuma conexão para phone_number_id=${event.externalRef}`);
      continue;
    }
    await processInboundEvent(supabase, whatsAppCloudProvider, connection, event);
  }

  // A Meta espera 200 rápido; reentrega automaticamente em caso de erro/timeout.
  return new Response("ok", { status: 200 });
}

import { whatsAppEvolutionProvider } from "@campanhas-mkt/channel-providers";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import { processInboundEvent, resolveChannelConnection } from "@/lib/webhooks/inbound-event";

interface EvolutionCredentials {
  apiKey?: string;
}

/**
 * A Evolution API não assina o corpo do webhook (ver comentário em
 * whatsapp-evolution/webhook.ts) — só manda o header `apikey`, que é por
 * instância/tenant, não global como o app secret da Meta. Por isso a ordem
 * aqui é diferente da rota do Cloud API: primeiro resolve o tenant pelo nome
 * da instância no corpo (ainda não confiável), só depois busca a apikey
 * daquele tenant específico no Vault e verifica contra o header recebido.
 * Um evento só é processado se as duas coisas baterem: a instância existir
 * E a apikey daquela instância bater com o header.
 */
export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text();
  const headerApiKey = request.headers.get("apikey");

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  const instance = (payload as { instance?: string }).instance;
  if (!instance) {
    return new Response("ok", { status: 200 });
  }

  const supabase = getServiceRoleClient();
  const connection = await resolveChannelConnection(supabase, "whatsapp_evolution", instance);
  if (!connection) {
    console.warn(`webhook evolution: nenhuma conexão para instance=${instance}`);
    return new Response("ok", { status: 200 });
  }

  const { data: credentials } = await supabase.rpc("get_channel_credentials", {
    p_connection_id: connection.id,
  });
  const apiKey = (credentials as EvolutionCredentials | null)?.apiKey;

  if (!apiKey) {
    console.error(`webhook evolution: conexão ${connection.id} sem apiKey no Vault`);
    return new Response("server misconfigured", { status: 500 });
  }

  const valid = whatsAppEvolutionProvider.verifyWebhookSignature({
    rawBody,
    signatureHeader: headerApiKey,
    appSecret: apiKey,
  });

  if (!valid) {
    return new Response("invalid apikey", { status: 401 });
  }

  const events = whatsAppEvolutionProvider.parseWebhookPayload(payload);
  for (const event of events) {
    await processInboundEvent(supabase, "whatsapp_evolution", connection.organization_id, event);
  }

  return new Response("ok", { status: 200 });
}

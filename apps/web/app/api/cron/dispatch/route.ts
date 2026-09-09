import { whatsAppCloudProvider, type ChannelCredentials } from "@campanhas-mkt/channel-providers";
import { getServiceRoleClient } from "@/lib/supabase/service-client";

const CAMPAIGNS_PER_TICK = 5;
const RECIPIENTS_PER_TICK = 50;

type ServiceClient = ReturnType<typeof getServiceRoleClient>;

interface PendingRecipient {
  id: string;
  organization_id: string;
  campaign_id: string;
  contact_id: string;
  contact_channel_id: string;
  campaigns: { channel: string; template_id: string | null; status: string };
}

/**
 * Chamada a cada tick pelo agendador externo. Vercel Cron só invoca por GET
 * e, quando a env var CRON_SECRET está configurada no projeto, anexa
 * automaticamente o header `Authorization: Bearer <CRON_SECRET>` — por isso
 * o handler principal é GET. POST fica disponível para disparo manual
 * (curl, ou pg_cron+pg_net como alternativa caso o plano da Vercel limite a
 * frequência do cron nativo) com a mesma checagem de segredo.
 *
 * Faz três coisas, nesta ordem, cada uma delegada a uma RPC atômica no banco
 * (ver 20250101000002_dispatch_rpcs.sql) para nunca fazer read-modify-write
 * na aplicação: 1) reivindica e expande campanhas cujo horário chegou;
 * 2) drena um lote de destinatários pendentes; 3) fecha campanhas sem mais
 * pendências.
 */
export async function GET(request: Request): Promise<Response> {
  return runDispatchTick(request);
}

export async function POST(request: Request): Promise<Response> {
  return runDispatchTick(request);
}

async function runDispatchTick(request: Request): Promise<Response> {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("unauthorized", { status: 401 });
  }

  const supabase = getServiceRoleClient();
  const summary = { expanded: 0, sent: 0, failed: 0, skippedOptOut: 0, completedCampaigns: 0 };

  const { data: claimed, error: claimError } = await supabase.rpc("claim_due_campaigns", {
    p_limit: CAMPAIGNS_PER_TICK,
  });
  if (claimError) console.error("claim_due_campaigns falhou", claimError);

  for (const campaign of claimed ?? []) {
    const { error } = await supabase.rpc("expand_campaign", { p_campaign_id: campaign.id });
    if (error) console.error(`expand_campaign falhou para ${campaign.id}`, error);
    else summary.expanded++;
  }

  const { data: recipients, error: recipientsError } = await supabase
    .from("campaign_recipients")
    .select("id, organization_id, campaign_id, contact_id, contact_channel_id, campaigns!inner(channel, template_id, status)")
    .eq("status", "pending")
    .eq("campaigns.status", "sending")
    .limit(RECIPIENTS_PER_TICK)
    .returns<PendingRecipient[]>();

  if (recipientsError) console.error("busca de destinatários pendentes falhou", recipientsError);

  for (const recipient of recipients ?? []) {
    // Defesa extra além do filtro embutido acima: nunca despachar para uma
    // campanha que não esteja mesmo em 'sending' (ex.: foi cancelada entre a
    // consulta e este ponto).
    if (recipient.campaigns.status !== "sending") continue;
    await dispatchRecipient(supabase, recipient, summary);
  }

  const { data: closedCount, error: closeError } = await supabase.rpc("close_finished_campaigns");
  if (closeError) console.error("close_finished_campaigns falhou", closeError);
  else summary.completedCampaigns = closedCount ?? 0;

  return Response.json(summary);
}

async function dispatchRecipient(
  supabase: ServiceClient,
  recipient: PendingRecipient,
  summary: { sent: number; failed: number; skippedOptOut: number },
): Promise<void> {
  const { data: contactChannel } = await supabase
    .from("contact_channels")
    .select("external_id, opt_in")
    .eq("id", recipient.contact_channel_id)
    .maybeSingle();

  // Consentimento é checado aqui, no instante do envio — não só no cadastro —
  // porque um opt-out feito depois que a campanha foi agendada ainda precisa
  // barrar a mensagem.
  if (!contactChannel?.opt_in) {
    await supabase.from("campaign_recipients").update({ status: "skipped_opt_out" }).eq("id", recipient.id);
    summary.skippedOptOut++;
    return;
  }

  const { data: claimData } = await supabase
    .rpc("claim_recipient_for_send", { p_recipient_id: recipient.id })
    .maybeSingle();
  const claim = claimData as { message_id: string } | null;

  if (!claim?.message_id) {
    // Já enviada por outro tick, ou esgotou tentativas — nada a fazer aqui.
    return;
  }

  const { data: connection } = await supabase
    .from("channel_connections")
    .select("id")
    .eq("organization_id", recipient.organization_id)
    .eq("channel", recipient.campaigns.channel)
    .eq("status", "active")
    .maybeSingle();

  if (!connection) {
    await supabase.rpc("record_send_failure", {
      p_message_id: claim.message_id,
      p_recipient_id: recipient.id,
      p_error: "nenhuma conexão de canal ativa para esta organização",
    });
    summary.failed++;
    return;
  }

  const { data: credentials } = await supabase.rpc("get_channel_credentials", {
    p_connection_id: connection.id,
  });

  let templateName: string | undefined;
  let templateLanguage: string | undefined;
  if (recipient.campaigns.template_id) {
    const { data: template } = await supabase
      .from("message_templates")
      .select("name, language, status")
      .eq("id", recipient.campaigns.template_id)
      .maybeSingle();

    if (template?.status !== "approved") {
      await supabase.rpc("record_send_failure", {
        p_message_id: claim.message_id,
        p_recipient_id: recipient.id,
        p_error: `template "${template?.name ?? recipient.campaigns.template_id}" não está aprovado`,
      });
      summary.failed++;
      return;
    }

    templateName = template.name;
    templateLanguage = template.language ?? undefined;
  }

  const result = await whatsAppCloudProvider.send(credentials as ChannelCredentials, {
    to: contactChannel.external_id,
    idempotencyKey: `${recipient.campaign_id}:${recipient.contact_id}`,
    ...(templateName !== undefined ? { templateName } : {}),
    ...(templateLanguage !== undefined ? { templateLanguage } : {}),
  });

  if (result.status === "sent") {
    await supabase.rpc("record_send_success", {
      p_message_id: claim.message_id,
      p_recipient_id: recipient.id,
      p_provider_message_id: result.providerMessageId,
    });
    summary.sent++;
  } else {
    await supabase.rpc("record_send_failure", {
      p_message_id: claim.message_id,
      p_recipient_id: recipient.id,
      p_error: result.error ?? "falha desconhecida no envio",
    });
    summary.failed++;
  }
}

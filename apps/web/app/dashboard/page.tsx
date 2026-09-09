import { getUserClient } from "@/lib/supabase/server-client";

// Sem alerta por e-mail/Slack (exigiria mais uma credencial que ainda não
// temos) — este limiar vira aviso visual no painel em vez disso.
const STUCK_QUEUE_MINUTES = 10;
const DEAD_LETTER_WINDOW_DAYS = 7;

export default async function DashboardOverviewPage() {
  const supabase = await getUserClient();

  const stuckSince = new Date(Date.now() - STUCK_QUEUE_MINUTES * 60_000).toISOString();
  const deadLetterSince = new Date(Date.now() - DEAD_LETTER_WINDOW_DAYS * 24 * 60 * 60_000).toISOString();

  const [
    { count: contactsCount },
    { count: campaignsCount },
    { count: connectionsCount },
    { count: deadLetterCount },
    { count: stuckCount },
  ] = await Promise.all([
    supabase.from("contacts").select("*", { count: "exact", head: true }),
    supabase.from("campaigns").select("*", { count: "exact", head: true }),
    supabase.from("channel_connections").select("*", { count: "exact", head: true }),
    supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .not("dead_letter_at", "is", null)
      .gte("dead_letter_at", deadLetterSince),
    supabase
      .from("campaign_recipients")
      .select("*, campaigns!inner(status)", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("campaigns.status", "sending")
      .lt("created_at", stuckSince),
  ]);

  const hasAlerts = (deadLetterCount ?? 0) > 0 || (stuckCount ?? 0) > 0;

  return (
    <section>
      <h1>Visão geral</h1>

      {hasAlerts ? (
        <div role="alert">
          <strong>Atenção:</strong>
          <ul>
            {(stuckCount ?? 0) > 0 ? (
              <li>
                {stuckCount} destinatário(s) pendente(s) há mais de {STUCK_QUEUE_MINUTES} minutos numa
                campanha em envio — o worker de dispatch pode não estar rodando.
              </li>
            ) : null}
            {(deadLetterCount ?? 0) > 0 ? (
              <li>
                {deadLetterCount} mensagem(ns) esgotaram as tentativas de envio nos últimos{" "}
                {DEAD_LETTER_WINDOW_DAYS} dias (dead-letter) — vale checar o motivo no Inbox/logs.
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      <ul>
        <li>Contatos: {contactsCount ?? 0}</li>
        <li>Campanhas: {campaignsCount ?? 0}</li>
        <li>Canais conectados: {connectionsCount ?? 0}</li>
      </ul>
      {connectionsCount === 0 ? (
        <p>
          Comece <a href="/dashboard/channels">conectando um número de WhatsApp</a>.
        </p>
      ) : null}
    </section>
  );
}

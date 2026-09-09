import { getCurrentOrg } from "@/lib/org";
import { getUserClient } from "@/lib/supabase/server-client";
import { createCampaign } from "./actions";

interface CampaignRow {
  id: string;
  name: string;
  status: string;
  scheduled_at: string;
}

interface TemplateOption {
  id: string;
  name: string;
}

interface SegmentOption {
  id: string;
  name: string;
}

interface StatusCounts {
  total: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  deadLetter: number;
}

async function getStatusCounts(
  supabase: Awaited<ReturnType<typeof getUserClient>>,
  campaignId: string,
): Promise<StatusCounts> {
  const countMessages = (status: string) =>
    supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .eq("status", status);

  const [
    { count: total },
    { count: sent },
    { count: delivered },
    { count: read },
    { count: failed },
    { count: deadLetter },
  ] = await Promise.all([
    supabase.from("campaign_recipients").select("*", { count: "exact", head: true }).eq("campaign_id", campaignId),
    countMessages("sent"),
    countMessages("delivered"),
    countMessages("read"),
    countMessages("failed"),
    supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .not("dead_letter_at", "is", null),
  ]);

  return {
    total: total ?? 0,
    sent: sent ?? 0,
    delivered: delivered ?? 0,
    read: read ?? 0,
    failed: failed ?? 0,
    deadLetter: deadLetter ?? 0,
  };
}

export default async function CampaignsPage() {
  const org = await getCurrentOrg();
  const supabase = await getUserClient();

  const [{ data: campaignsData }, { data: templatesData }, { data: segmentsData }] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id, name, status, scheduled_at")
      .order("scheduled_at", { ascending: false })
      .returns<CampaignRow[]>(),
    supabase
      .from("message_templates")
      .select("id, name")
      .eq("status", "approved")
      .returns<TemplateOption[]>(),
    supabase.from("segments").select("id, name").returns<SegmentOption[]>(),
  ]);

  const campaigns = campaignsData ?? [];
  const templates = templatesData ?? [];
  const segments = segmentsData ?? [];

  const counts = await Promise.all(campaigns.map((c) => getStatusCounts(supabase, c.id)));

  async function audienceCount(segmentId: string | null): Promise<number> {
    if (!org) return 0;
    const { data } = await supabase.rpc("count_segment_audience", {
      p_organization_id: org.organizationId,
      p_channel: "whatsapp",
      p_segment_id: segmentId,
    });
    return (data as number | null) ?? 0;
  }

  const [allOptInCount, segmentCounts] = await Promise.all([
    audienceCount(null),
    Promise.all(segments.map((s) => audienceCount(s.id))),
  ]);

  return (
    <section>
      <h1>Campanhas</h1>

      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Status</th>
            <th>Agendada para</th>
            <th>Total</th>
            <th>Enviadas</th>
            <th>Entregues</th>
            <th>Lidas</th>
            <th>Falhas</th>
            <th>Dead-letter</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((campaign, i) => {
            const c = counts[i];
            const enviadas = (c?.sent ?? 0) + (c?.delivered ?? 0) + (c?.read ?? 0);
            return (
              <tr key={campaign.id}>
                <td>{campaign.name}</td>
                <td>{campaign.status}</td>
                <td>{new Date(campaign.scheduled_at).toLocaleString("pt-BR")}</td>
                <td>{c?.total ?? 0}</td>
                <td>{enviadas}</td>
                <td>{c?.delivered ?? 0}</td>
                <td>{c?.read ?? 0}</td>
                <td>{c?.failed ?? 0}</td>
                <td>{c?.deadLetter ?? 0}</td>
              </tr>
            );
          })}
          {campaigns.length === 0 ? (
            <tr>
              <td colSpan={9}>Nenhuma campanha ainda.</td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <h2>Nova campanha</h2>
      {templates.length === 0 ? (
        <p>
          Nenhum template aprovado ainda — <a href="/dashboard/templates">crie um</a> primeiro.
        </p>
      ) : (
        <form action={createCampaign}>
          <label>
            Nome
            <input name="name" required placeholder="Reengajamento de setembro" />
          </label>
          <label>
            Template
            <select name="templateId" required>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Segmento (opcional)
            <select name="segmentId">
              <option value="">Todo contato com opt-in no WhatsApp ({allOptInCount} contato(s))</option>
              {segments.map((s, i) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({segmentCounts[i]} contato(s))
                </option>
              ))}
            </select>
          </label>
          <label>
            Agendar para
            <input name="scheduledAt" type="datetime-local" required />
          </label>
          <p>
            Sem segmento, envia pra todo contato com opt-in no WhatsApp. Crie segmentos em{" "}
            <a href="/dashboard/segments">Segmentos</a>.
          </p>
          <button type="submit">Agendar</button>
        </form>
      )}
    </section>
  );
}

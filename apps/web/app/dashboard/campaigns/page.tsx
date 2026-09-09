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

async function getRecipientCounts(
  supabase: Awaited<ReturnType<typeof getUserClient>>,
  campaignId: string,
): Promise<{ total: number; sent: number }> {
  const [{ count: total }, { count: sent }] = await Promise.all([
    supabase
      .from("campaign_recipients")
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", campaignId),
    supabase
      .from("campaign_recipients")
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .eq("status", "sent"),
  ]);

  return { total: total ?? 0, sent: sent ?? 0 };
}

export default async function CampaignsPage() {
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

  const counts = await Promise.all(campaigns.map((c) => getRecipientCounts(supabase, c.id)));

  return (
    <section>
      <h1>Campanhas</h1>

      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Status</th>
            <th>Agendada para</th>
            <th>Enviadas / Total</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((campaign, i) => (
            <tr key={campaign.id}>
              <td>{campaign.name}</td>
              <td>{campaign.status}</td>
              <td>{new Date(campaign.scheduled_at).toLocaleString("pt-BR")}</td>
              <td>
                {counts[i]?.sent ?? 0} / {counts[i]?.total ?? 0}
              </td>
            </tr>
          ))}
          {campaigns.length === 0 ? (
            <tr>
              <td colSpan={4}>Nenhuma campanha ainda.</td>
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
              <option value="">Todo contato com opt-in no WhatsApp</option>
              {segments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
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

import { getUserClient } from "@/lib/supabase/server-client";

interface UsageRow {
  id: string;
  channel: string;
  period: string;
  sent_count: number;
}

export default async function UsagePage() {
  const supabase = await getUserClient();
  const { data } = await supabase
    .from("usage_counters")
    .select("id, channel, period, sent_count")
    .order("period", { ascending: false })
    .returns<UsageRow[]>();

  const rows = data ?? [];
  const totalSent = rows.reduce((sum, r) => sum + r.sent_count, 0);

  return (
    <section>
      <h1>Uso</h1>
      <p>Mensagens efetivamente enviadas, por canal e por mês (incrementado a cada envio confirmado pelo worker).</p>
      <p>
        <b>Total geral: {totalSent}</b>
      </p>

      <table>
        <thead>
          <tr>
            <th>Período</th>
            <th>Canal</th>
            <th>Enviadas</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{new Date(r.period).toLocaleDateString("pt-BR", { year: "numeric", month: "long" })}</td>
              <td>{r.channel}</td>
              <td>{r.sent_count}</td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={3}>Nenhum envio registrado ainda.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </section>
  );
}

import { getUserClient } from "@/lib/supabase/server-client";
import { createSegment } from "./actions";

interface SegmentRow {
  id: string;
  name: string;
  definition: { type?: string; tag?: string } | null;
}

function describeDefinition(definition: SegmentRow["definition"]): string {
  if (!definition || definition.type === "all") return "Todo contato com opt-in";
  if (definition.type === "tag") return `Tag "${definition.tag}"`;
  return "—";
}

export default async function SegmentsPage() {
  const supabase = await getUserClient();
  const { data } = await supabase
    .from("segments")
    .select("id, name, definition")
    .order("created_at", { ascending: false })
    .returns<SegmentRow[]>();

  const segments = data ?? [];

  return (
    <section>
      <h1>Segmentos</h1>
      <p>Uma campanha sem segmento envia pra todo contato com opt-in no canal. Um segmento restringe isso.</p>

      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Filtro</th>
          </tr>
        </thead>
        <tbody>
          {segments.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{describeDefinition(s.definition)}</td>
            </tr>
          ))}
          {segments.length === 0 ? (
            <tr>
              <td colSpan={2}>Nenhum segmento ainda.</td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <h2>Novo segmento</h2>
      <form action={createSegment}>
        <label>
          Nome
          <input name="name" required placeholder="Clientes VIP" />
        </label>
        <label>
          Tipo
          <select name="type">
            <option value="all">Todo contato com opt-in</option>
            <option value="tag">Contatos com uma tag específica</option>
          </select>
        </label>
        <label>
          Tag (só se o tipo acima for "tag")
          <input name="tag" placeholder="vip" />
        </label>
        <button type="submit">Criar</button>
      </form>
    </section>
  );
}

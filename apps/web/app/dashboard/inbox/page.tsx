import { getUserClient } from "@/lib/supabase/server-client";

interface ConversationRow {
  id: string;
  channel: string;
  last_message_at: string | null;
  contacts: { full_name: string | null } | null;
}

export default async function InboxPage() {
  const supabase = await getUserClient();
  const { data } = await supabase
    .from("conversations")
    .select("id, channel, last_message_at, contacts(full_name)")
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .returns<ConversationRow[]>();

  const conversations = data ?? [];

  return (
    <section>
      <h1>Inbox</h1>
      <p>Respostas recebidas pelos canais bidirecionais (WhatsApp), gravadas pelo webhook.</p>

      <table>
        <thead>
          <tr>
            <th>Contato</th>
            <th>Canal</th>
            <th>Última mensagem</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {conversations.map((c) => (
            <tr key={c.id}>
              <td>{c.contacts?.full_name ?? "Contato sem nome"}</td>
              <td>{c.channel}</td>
              <td>{c.last_message_at ? new Date(c.last_message_at).toLocaleString("pt-BR") : "—"}</td>
              <td>
                <a href={`/dashboard/inbox/${c.id}`}>Abrir</a>
              </td>
            </tr>
          ))}
          {conversations.length === 0 ? (
            <tr>
              <td colSpan={4}>Nenhuma conversa ainda.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </section>
  );
}

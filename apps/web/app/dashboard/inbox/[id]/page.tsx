import { notFound } from "next/navigation";
import { getUserClient } from "@/lib/supabase/server-client";

interface ConversationDetail {
  id: string;
  channel: string;
  contact_id: string;
  contacts: { full_name: string | null } | null;
}

interface MessageRow {
  id: string;
  direction: string;
  status: string;
  body: string | null;
  created_at: string;
}

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getUserClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, channel, contact_id, contacts(full_name)")
    .eq("id", id)
    .maybeSingle<ConversationDetail>();

  if (!conversation) notFound();

  const { data: messagesData } = await supabase
    .from("messages")
    .select("id, direction, status, body, created_at")
    .eq("contact_id", conversation.contact_id)
    .eq("channel", conversation.channel)
    .order("created_at", { ascending: true })
    .returns<MessageRow[]>();

  const messages = messagesData ?? [];

  return (
    <section>
      <p>
        <a href="/dashboard/inbox">← Inbox</a>
      </p>
      <h1>{conversation.contacts?.full_name ?? "Contato sem nome"}</h1>
      <p>Canal: {conversation.channel}</p>

      <ul>
        {messages.map((m) => (
          <li key={m.id}>
            <b>{m.direction === "inbound" ? "Recebida" : "Enviada"}</b> ·{" "}
            {new Date(m.created_at).toLocaleString("pt-BR")} · {m.status}
            <p>{m.body ?? "(sem texto — provavelmente um template)"}</p>
          </li>
        ))}
        {messages.length === 0 ? <li>Nenhuma mensagem ainda.</li> : null}
      </ul>
    </section>
  );
}

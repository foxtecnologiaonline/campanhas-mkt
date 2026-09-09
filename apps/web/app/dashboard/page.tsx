import { getUserClient } from "@/lib/supabase/server-client";

export default async function DashboardOverviewPage() {
  const supabase = await getUserClient();

  const [{ count: contactsCount }, { count: campaignsCount }, { count: connectionsCount }] =
    await Promise.all([
      supabase.from("contacts").select("*", { count: "exact", head: true }),
      supabase.from("campaigns").select("*", { count: "exact", head: true }),
      supabase.from("channel_connections").select("*", { count: "exact", head: true }),
    ]);

  return (
    <section>
      <h1>Visão geral</h1>
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

import { getUserClient } from "@/lib/supabase/server-client";
import { connectWhatsAppCloud } from "./actions";

interface ChannelConnectionRow {
  id: string;
  provider: string;
  external_ref: string;
  status: string;
}

export default async function ChannelsPage() {
  const supabase = await getUserClient();
  const { data } = await supabase
    .from("channel_connections")
    .select("id, provider, external_ref, status")
    .returns<ChannelConnectionRow[]>();

  const connections = data ?? [];

  return (
    <section>
      <h1>Canais</h1>

      <table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>phone_number_id</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {connections.map((c) => (
            <tr key={c.id}>
              <td>{c.provider}</td>
              <td>{c.external_ref}</td>
              <td>{c.status}</td>
            </tr>
          ))}
          {connections.length === 0 ? (
            <tr>
              <td colSpan={3}>Nenhum canal conectado ainda.</td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <h2>Conectar WhatsApp Cloud API</h2>
      <p>
        Pegue o <code>phone_number_id</code> e um access token no App Meta do WABA em
        developers.facebook.com. O token fica só no Supabase Vault — nunca é exibido de volta aqui.
      </p>
      <form action={connectWhatsAppCloud}>
        <label>
          phone_number_id
          <input name="phoneNumberId" required />
        </label>
        <label>
          Access token
          <input name="accessToken" type="password" required />
        </label>
        <button type="submit">Conectar</button>
      </form>
    </section>
  );
}

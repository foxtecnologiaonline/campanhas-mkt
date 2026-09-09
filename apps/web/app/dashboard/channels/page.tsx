import { getUserClient } from "@/lib/supabase/server-client";
import { connectChannel, updateChannelCredentials } from "./actions";

interface ChannelConnectionRow {
  id: string;
  provider: string;
  external_ref: string;
  status: string;
}

function UpdateCredentialsForm({ connection }: { connection: ChannelConnectionRow }) {
  return (
    <details>
      <summary>Atualizar credenciais</summary>
      <form action={updateChannelCredentials}>
        <input type="hidden" name="connectionId" value={connection.id} />
        <input type="hidden" name="provider" value={connection.provider} />
        {connection.provider === "whatsapp_cloud" ? (
          <>
            <label>
              phone_number_id
              <input name="phoneNumberId" defaultValue={connection.external_ref} required />
            </label>
            <label>
              Novo access token
              <input name="accessToken" type="password" required />
            </label>
            <label>
              waba_id (opcional)
              <input name="wabaId" />
            </label>
          </>
        ) : (
          <>
            <label>
              URL do servidor
              <input name="serverUrl" required />
            </label>
            <label>
              Nome da instância
              <input name="instance" defaultValue={connection.external_ref} required />
            </label>
            <label>
              Nova apiKey
              <input name="apiKey" type="password" required />
            </label>
          </>
        )}
        <button type="submit">Salvar</button>
      </form>
    </details>
  );
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
            <th>Identificador</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {connections.map((c) => (
            <tr key={c.id}>
              <td>{c.provider === "whatsapp_cloud" ? "WhatsApp Cloud API" : "Evolution API"}</td>
              <td>{c.external_ref}</td>
              <td>{c.status}</td>
              <td>
                <UpdateCredentialsForm connection={c} />
              </td>
            </tr>
          ))}
          {connections.length === 0 ? (
            <tr>
              <td colSpan={4}>Nenhum canal conectado ainda.</td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <h2>Conectar WhatsApp Cloud API (oficial)</h2>
      <p>
        Pegue o <code>phone_number_id</code> e um access token no App Meta do WABA em
        developers.facebook.com. O token fica só no Supabase Vault — nunca é exibido de volta aqui.
      </p>
      <form action={connectChannel}>
        <input type="hidden" name="provider" value="whatsapp_cloud" />
        <label>
          phone_number_id
          <input name="phoneNumberId" required />
        </label>
        <label>
          Access token
          <input name="accessToken" type="password" required />
        </label>
        <label>
          waba_id (opcional — só necessário pra submeter template de aprovação)
          <input name="wabaId" />
        </label>
        <button type="submit">Conectar</button>
      </form>

      <h2>Conectar Evolution API</h2>
      <p>
        Sem aprovação de template da Meta e sem janela de 24h — mas fora dos termos de uso do
        WhatsApp, com risco de bloqueio do número. A apiKey também fica só no Vault.
      </p>
      <form action={connectChannel}>
        <input type="hidden" name="provider" value="whatsapp_evolution" />
        <label>
          URL do servidor
          <input name="serverUrl" required placeholder="https://sua-instancia.zapscript.com.br" />
        </label>
        <label>
          Nome da instância
          <input name="instance" required />
        </label>
        <label>
          apiKey
          <input name="apiKey" type="password" required />
        </label>
        <button type="submit">Conectar</button>
      </form>
    </section>
  );
}

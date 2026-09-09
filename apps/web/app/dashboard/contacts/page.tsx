import { getUserClient } from "@/lib/supabase/server-client";
import { addContact } from "./actions";
import { CsvImportForm } from "./csv-import-form";

interface ContactRow {
  id: string;
  full_name: string | null;
  custom_fields: { tags?: string[] } | null;
  contact_channels: { channel: string; external_id: string; opt_in: boolean }[];
}

export default async function ContactsPage() {
  const supabase = await getUserClient();
  const { data } = await supabase
    .from("contacts")
    .select("id, full_name, custom_fields, contact_channels(channel, external_id, opt_in)")
    .order("created_at", { ascending: false })
    .returns<ContactRow[]>();

  const contacts = data ?? [];

  return (
    <section>
      <h1>Contatos</h1>

      <form action={addContact}>
        <label>
          Nome
          <input name="fullName" placeholder="Maria Silva" />
        </label>
        <label>
          WhatsApp
          <input name="phone" required placeholder="11999999999" />
        </label>
        <label>
          Tags (separadas por vírgula)
          <input name="tags" placeholder="vip, sp" />
        </label>
        <button type="submit">Adicionar</button>
      </form>

      <h2>Importar via CSV</h2>
      <CsvImportForm />

      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>WhatsApp</th>
            <th>Tags</th>
            <th>Opt-in</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => {
            const whatsapp = contact.contact_channels.find((c) => c.channel === "whatsapp");
            return (
              <tr key={contact.id}>
                <td>{contact.full_name ?? "—"}</td>
                <td>{whatsapp?.external_id ?? "—"}</td>
                <td>{(contact.custom_fields?.tags ?? []).join(", ") || "—"}</td>
                <td>{whatsapp?.opt_in ? "sim" : "não"}</td>
              </tr>
            );
          })}
          {contacts.length === 0 ? (
            <tr>
              <td colSpan={4}>Nenhum contato ainda.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </section>
  );
}

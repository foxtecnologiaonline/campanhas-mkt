import { getUserClient } from "@/lib/supabase/server-client";
import { createTemplate, markTemplateApproved, submitTemplateToMeta } from "./actions";

interface TemplateRow {
  id: string;
  name: string;
  language: string;
  category: string | null;
  body: string;
  status: string;
}

export default async function TemplatesPage() {
  const supabase = await getUserClient();
  const { data } = await supabase
    .from("message_templates")
    .select("id, name, language, category, body, status")
    .order("created_at", { ascending: false })
    .returns<TemplateRow[]>();

  const templates = data ?? [];

  return (
    <section>
      <h1>Templates</h1>

      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Idioma</th>
            <th>Categoria</th>
            <th>Corpo</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {templates.map((t) => (
            <tr key={t.id}>
              <td>{t.name}</td>
              <td>{t.language}</td>
              <td>{t.category ?? "—"}</td>
              <td>{t.body}</td>
              <td>{t.status}</td>
              <td>
                {t.status === "draft" ? (
                  <>
                    <form action={submitTemplateToMeta} style={{ display: "inline" }}>
                      <input type="hidden" name="templateId" value={t.id} />
                      <button type="submit">Submeter à Meta</button>
                    </form>{" "}
                    <form action={markTemplateApproved} style={{ display: "inline" }}>
                      <input type="hidden" name="templateId" value={t.id} />
                      <button type="submit">Marcar aprovado (manual, dev)</button>
                    </form>
                  </>
                ) : null}
              </td>
            </tr>
          ))}
          {templates.length === 0 ? (
            <tr>
              <td colSpan={6}>Nenhum template ainda.</td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <h2>Novo template</h2>
      <p>
        "Submeter à Meta" manda de verdade pra fila de aprovação (precisa de <code>waba_id</code> na
        conexão WhatsApp Cloud API, em Canais). O status muda pra "pending_review"; a aprovação em si
        ainda não volta sozinha por webhook — confira no Business Manager e use "marcar aprovado"
        quando a Meta aprovar de verdade.
      </p>
      <form action={createTemplate}>
        <label>
          Nome
          <input name="name" required placeholder="boas_vindas" />
        </label>
        <label>
          Categoria
          <select name="category">
            <option value="MARKETING">Marketing</option>
            <option value="UTILITY">Utilidade</option>
            <option value="AUTHENTICATION">Autenticação</option>
          </select>
        </label>
        <label>
          Corpo
          <textarea name="body" required placeholder="Olá! Bem-vindo(a)." />
        </label>
        <button type="submit">Criar</button>
      </form>
    </section>
  );
}

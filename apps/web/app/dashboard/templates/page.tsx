import { getUserClient } from "@/lib/supabase/server-client";
import { createTemplate, markTemplateApproved } from "./actions";

interface TemplateRow {
  id: string;
  name: string;
  language: string;
  body: string;
  status: string;
}

export default async function TemplatesPage() {
  const supabase = await getUserClient();
  const { data } = await supabase
    .from("message_templates")
    .select("id, name, language, body, status")
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
              <td>{t.body}</td>
              <td>{t.status}</td>
              <td>
                {t.status !== "approved" ? (
                  <form action={markTemplateApproved}>
                    <input type="hidden" name="templateId" value={t.id} />
                    <button type="submit">Marcar aprovado (manual)</button>
                  </form>
                ) : null}
              </td>
            </tr>
          ))}
          {templates.length === 0 ? (
            <tr>
              <td colSpan={5}>Nenhum template ainda.</td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <h2>Novo template</h2>
      <p>
        Sem integração com a submissão de HSM da Meta ainda: crie aqui e use "marcar aprovado" pra
        testar o envio — em produção, isso precisa ser aprovado de verdade no Meta antes de sair.
      </p>
      <form action={createTemplate}>
        <label>
          Nome
          <input name="name" required placeholder="boas_vindas" />
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

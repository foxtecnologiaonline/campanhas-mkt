"use client";

import { useFormState, useFormStatus } from "react-dom";
import { importContactsCsv, type ImportResult } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Importando…" : "Importar"}
    </button>
  );
}

export function CsvImportForm() {
  const [result, formAction] = useFormState<ImportResult | null, FormData>(importContactsCsv, null);

  return (
    <form action={formAction}>
      <label>
        Arquivo CSV (colunas: nome,telefone,tags — tags separadas por ";")
        <input type="file" name="file" accept=".csv,text/csv" required />
      </label>
      <SubmitButton />
      {result ? (
        <p role="status">
          {result.imported} contato(s) importado(s){result.skipped > 0 ? `, ${result.skipped} ignorado(s) (sem telefone ou com erro)` : ""}.
        </p>
      ) : null}
    </form>
  );
}

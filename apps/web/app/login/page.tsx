"use client";

import { useFormState, useFormStatus } from "react-dom";
import { requestMagicLink, type LoginState } from "./actions";

const initialState: LoginState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Enviando…" : "Enviar link de acesso"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(requestMagicLink, initialState);

  return (
    <main>
      <h1>Entrar</h1>
      <p>Sem senha: você recebe um link por e-mail e ele abre o painel logado.</p>
      <form action={formAction}>
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
        <SubmitButton />
      </form>
      {state.status !== "idle" ? <p role="status">{state.message}</p> : null}
    </main>
  );
}

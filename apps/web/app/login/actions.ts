"use server";

import { getUserClient } from "@/lib/supabase/server-client";

export interface LoginState {
  status: "idle" | "sent" | "error";
  message?: string;
}

export async function requestMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { status: "error", message: "Informe um e-mail." };
  }

  const supabase = await getUserClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  return { status: "sent", message: `Link de acesso enviado para ${email}.` };
}

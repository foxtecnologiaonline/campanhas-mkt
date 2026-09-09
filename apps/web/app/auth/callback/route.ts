import { getUserClient } from "@/lib/supabase/server-client";

/** Troca o código do magic link por uma sessão e manda o usuário pro painel. */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (code) {
    const supabase = await getUserClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return Response.redirect(new URL("/dashboard", url.origin));
}

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente com a chave anon, autenticado com a sessão do usuário via cookies.
 * Toda consulta feita com este cliente passa pela RLS — é o cliente certo
 * para Server Components e Server Actions do painel. Nunca usar a service
 * role aqui: isso ignoraria o isolamento por organização.
 */
export async function getUserClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // chamado a partir de um Server Component sem permissão de escrita;
            // o middleware já cuida de renovar a sessão nesse caso.
          }
        },
      },
    },
  );
}

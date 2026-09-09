import { getUserClient } from "@/lib/supabase/server-client";

export interface CurrentOrg {
  organizationId: string;
  organizationName: string;
  role: "owner" | "admin" | "agent";
  userEmail: string | null;
}

/**
 * MVP: um usuário pertence a uma única organização (a criada automaticamente
 * no primeiro login, ver migration 20250101000003). Quando convites entre
 * organizações existirem, isso vira um seletor em vez de "a primeira linha".
 */
export async function getCurrentOrg(): Promise<CurrentOrg | null> {
  const supabase = await getUserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from("memberships")
    .select("organization_id, role, organizations(name)")
    .limit(1)
    .maybeSingle();

  if (!membership) return null;

  const organization = membership.organizations as unknown as { name: string } | null;

  return {
    organizationId: membership.organization_id as string,
    organizationName: organization?.name ?? "Organização",
    role: membership.role as CurrentOrg["role"],
    userEmail: user.email ?? null,
  };
}

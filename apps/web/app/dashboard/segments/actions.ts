"use server";

import { revalidatePath } from "next/cache";
import { getCurrentOrg } from "@/lib/org";
import { getUserClient } from "@/lib/supabase/server-client";

export async function createSegment(formData: FormData): Promise<void> {
  const org = await getCurrentOrg();
  if (!org) throw new Error("sem organização");

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const tag = String(formData.get("tag") ?? "").trim();

  if (!name) throw new Error("nome é obrigatório");
  if (type === "tag" && !tag) throw new Error("informe a tag");

  const definition = type === "tag" ? { type: "tag", tag } : { type: "all" };

  const supabase = await getUserClient();
  const { error } = await supabase.from("segments").insert({
    organization_id: org.organizationId,
    name,
    definition,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/segments");
}

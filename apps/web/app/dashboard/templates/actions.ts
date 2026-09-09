"use server";

import { revalidatePath } from "next/cache";
import { getCurrentOrg } from "@/lib/org";
import { getUserClient } from "@/lib/supabase/server-client";

export async function createTemplate(formData: FormData): Promise<void> {
  const org = await getCurrentOrg();
  if (!org) throw new Error("sem organização");

  const name = String(formData.get("name") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!name || !body) throw new Error("nome e corpo são obrigatórios");

  const supabase = await getUserClient();
  const { error } = await supabase.from("message_templates").insert({
    organization_id: org.organizationId,
    channel: "whatsapp",
    name,
    language: "pt_BR",
    body,
    status: "draft",
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/templates");
}

/**
 * MVP: fluxo de submissão à Meta para aprovação de HSM ainda não existe —
 * este botão só marca o status manualmente, pra permitir testar o pipeline
 * de envio de ponta a ponta. Ver doc de arquitetura, seção de templates.
 */
export async function markTemplateApproved(formData: FormData): Promise<void> {
  const templateId = String(formData.get("templateId") ?? "");
  if (!templateId) return;

  const supabase = await getUserClient();
  const { error } = await supabase
    .from("message_templates")
    .update({ status: "approved" })
    .eq("id", templateId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/templates");
}

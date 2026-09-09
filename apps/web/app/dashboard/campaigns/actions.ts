"use server";

import { revalidatePath } from "next/cache";
import { getCurrentOrg } from "@/lib/org";
import { getUserClient } from "@/lib/supabase/server-client";

export async function createCampaign(formData: FormData): Promise<void> {
  const org = await getCurrentOrg();
  if (!org) throw new Error("sem organização");

  const name = String(formData.get("name") ?? "").trim();
  const templateId = String(formData.get("templateId") ?? "");
  const segmentId = String(formData.get("segmentId") ?? "");
  const scheduledAt = String(formData.get("scheduledAt") ?? "");
  if (!name || !templateId || !scheduledAt) {
    throw new Error("nome, template e data de agendamento são obrigatórios");
  }

  const supabase = await getUserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sem segmento selecionado, expand_campaign trata como "todo contato com
  // opt-in no canal" (ver migration 20250101000004).
  const { error } = await supabase.from("campaigns").insert({
    organization_id: org.organizationId,
    name,
    channel: "whatsapp",
    template_id: templateId,
    segment_id: segmentId || null,
    scheduled_at: new Date(scheduledAt).toISOString(),
    status: "scheduled",
    created_by: user?.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/campaigns");
}

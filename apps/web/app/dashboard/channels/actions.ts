"use server";

import { revalidatePath } from "next/cache";
import { getCurrentOrg } from "@/lib/org";
import { getUserClient } from "@/lib/supabase/server-client";

/**
 * Chama a RPC create_channel_connection, que já reforça "só admin/owner"
 * dentro do banco (ver migration 20250101000002) — a checagem aqui é só
 * pra dar um erro mais cedo/mais claro na UI, não é a defesa real.
 */
export async function connectWhatsAppCloud(formData: FormData): Promise<void> {
  const org = await getCurrentOrg();
  if (!org) throw new Error("sem organização");
  if (org.role === "agent") {
    throw new Error("somente admin/owner pode conectar um canal");
  }

  const phoneNumberId = String(formData.get("phoneNumberId") ?? "").trim();
  const accessToken = String(formData.get("accessToken") ?? "").trim();
  if (!phoneNumberId || !accessToken) {
    throw new Error("phone_number_id e access token são obrigatórios");
  }

  const supabase = await getUserClient();
  const { error } = await supabase.rpc("create_channel_connection", {
    p_organization_id: org.organizationId,
    p_channel: "whatsapp",
    p_provider: "whatsapp_cloud",
    p_external_ref: phoneNumberId,
    p_credentials: { accessToken, phoneNumberId },
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/channels");
}

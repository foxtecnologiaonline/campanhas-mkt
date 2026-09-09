"use server";

import { revalidatePath } from "next/cache";
import { getCurrentOrg } from "@/lib/org";
import { getUserClient } from "@/lib/supabase/server-client";

/**
 * Chama a RPC create_channel_connection, que já reforça "só admin/owner"
 * dentro do banco (ver migration 20250101000002) — a checagem aqui é só
 * pra dar um erro mais cedo/mais claro na UI, não é a defesa real.
 */
export async function connectChannel(formData: FormData): Promise<void> {
  const org = await getCurrentOrg();
  if (!org) throw new Error("sem organização");
  if (org.role === "agent") {
    throw new Error("somente admin/owner pode conectar um canal");
  }

  const provider = String(formData.get("provider") ?? "");
  const supabase = await getUserClient();

  let externalRef: string;
  let credentials: Record<string, string>;

  if (provider === "whatsapp_cloud") {
    const phoneNumberId = String(formData.get("phoneNumberId") ?? "").trim();
    const accessToken = String(formData.get("accessToken") ?? "").trim();
    if (!phoneNumberId || !accessToken) {
      throw new Error("phone_number_id e access token são obrigatórios");
    }
    externalRef = phoneNumberId;
    credentials = { accessToken, phoneNumberId };
  } else if (provider === "whatsapp_evolution") {
    const serverUrl = String(formData.get("serverUrl") ?? "").trim();
    const instance = String(formData.get("instance") ?? "").trim();
    const apiKey = String(formData.get("apiKey") ?? "").trim();
    if (!serverUrl || !instance || !apiKey) {
      throw new Error("serverUrl, instance e apiKey são obrigatórios");
    }
    externalRef = instance;
    credentials = { serverUrl, instance, apiKey };
  } else {
    throw new Error("provider inválido");
  }

  const { error } = await supabase.rpc("create_channel_connection", {
    p_organization_id: org.organizationId,
    p_channel: "whatsapp",
    p_provider: provider,
    p_external_ref: externalRef,
    p_credentials: credentials,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/channels");
}

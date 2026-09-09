"use server";

import { revalidatePath } from "next/cache";
import { getCurrentOrg } from "@/lib/org";
import { getUserClient } from "@/lib/supabase/server-client";

interface CredentialsWithRef {
  externalRef: string;
  credentials: Record<string, string>;
}

function buildCloudCredentials(formData: FormData): CredentialsWithRef {
  const phoneNumberId = String(formData.get("phoneNumberId") ?? "").trim();
  const accessToken = String(formData.get("accessToken") ?? "").trim();
  const wabaId = String(formData.get("wabaId") ?? "").trim();
  if (!phoneNumberId || !accessToken) {
    throw new Error("phone_number_id e access token são obrigatórios");
  }
  // wabaId é opcional aqui (o envio de mensagem não precisa dele) mas é
  // exigido pra submeter template de aprovação — ver templates/actions.ts.
  const credentials = wabaId ? { accessToken, phoneNumberId, wabaId } : { accessToken, phoneNumberId };
  return { externalRef: phoneNumberId, credentials };
}

function buildEvolutionCredentials(formData: FormData): CredentialsWithRef {
  const serverUrl = String(formData.get("serverUrl") ?? "").trim();
  const instance = String(formData.get("instance") ?? "").trim();
  const apiKey = String(formData.get("apiKey") ?? "").trim();
  if (!serverUrl || !instance || !apiKey) {
    throw new Error("serverUrl, instance e apiKey são obrigatórios");
  }
  return { externalRef: instance, credentials: { serverUrl, instance, apiKey } };
}

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
    ({ externalRef, credentials } = buildCloudCredentials(formData));
  } else if (provider === "whatsapp_evolution") {
    ({ externalRef, credentials } = buildEvolutionCredentials(formData));
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

/**
 * Gira a credencial de uma conexão existente sem trocar o id (e sem afetar
 * campaign_recipients/messages que já referenciam essa conexão). A RPC
 * também reforça "só admin/owner" dentro do banco.
 */
export async function updateChannelCredentials(formData: FormData): Promise<void> {
  const org = await getCurrentOrg();
  if (!org) throw new Error("sem organização");
  if (org.role === "agent") {
    throw new Error("somente admin/owner pode atualizar credenciais");
  }

  const connectionId = String(formData.get("connectionId") ?? "");
  const provider = String(formData.get("provider") ?? "");
  if (!connectionId) throw new Error("conexão inválida");

  const { credentials } =
    provider === "whatsapp_cloud" ? buildCloudCredentials(formData) : buildEvolutionCredentials(formData);

  const supabase = await getUserClient();
  const { error } = await supabase.rpc("update_channel_connection_credentials", {
    p_connection_id: connectionId,
    p_credentials: credentials,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/channels");
}

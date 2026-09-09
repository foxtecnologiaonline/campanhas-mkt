"use server";

import { revalidatePath } from "next/cache";
import { submitWhatsAppCloudTemplate, type ChannelCredentials } from "@campanhas-mkt/channel-providers";
import { getCurrentOrg } from "@/lib/org";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import { getUserClient } from "@/lib/supabase/server-client";

export async function createTemplate(formData: FormData): Promise<void> {
  const org = await getCurrentOrg();
  if (!org) throw new Error("sem organização");

  const name = String(formData.get("name") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const category = String(formData.get("category") ?? "MARKETING");
  if (!name || !body) throw new Error("nome e corpo são obrigatórios");

  const supabase = await getUserClient();
  const { error } = await supabase.from("message_templates").insert({
    organization_id: org.organizationId,
    channel: "whatsapp",
    name,
    language: "pt_BR",
    category,
    body,
    status: "draft",
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/templates");
}

/**
 * Atalho de desenvolvimento: marca aprovado sem passar pela Meta, pra dar
 * pra testar o pipeline de envio sem esperar uma aprovação real. Deixado
 * como fallback — em produção, use "Submeter à Meta" abaixo.
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

/**
 * Submete o template de verdade pra fila de aprovação da Meta. Usa a
 * service role só pra ler a credencial do Vault (o cliente do usuário nunca
 * tem acesso a isso) — a checagem de que o template pertence à organização
 * do usuário já vem da RLS na leitura feita com o cliente comum antes disso.
 *
 * Nunca testado contra uma conta Meta real (ver comentário em
 * whatsapp-cloud/client.ts); se a resposta da Graph API vier num formato
 * diferente do esperado, o erro aparece aqui pro usuário, não falha silenciosa.
 */
export async function submitTemplateToMeta(formData: FormData): Promise<void> {
  const org = await getCurrentOrg();
  if (!org) throw new Error("sem organização");
  if (org.role === "agent") throw new Error("somente admin/owner pode submeter um template");

  const templateId = String(formData.get("templateId") ?? "");
  if (!templateId) throw new Error("template inválido");

  const userClient = await getUserClient();
  const { data: template, error: templateError } = await userClient
    .from("message_templates")
    .select("id, name, language, category, body")
    .eq("id", templateId)
    .single();

  if (templateError || !template) throw new Error("template não encontrado");

  const serviceClient = getServiceRoleClient();
  const { data: connection } = await serviceClient
    .from("channel_connections")
    .select("id")
    .eq("organization_id", org.organizationId)
    .eq("provider", "whatsapp_cloud")
    .eq("status", "active")
    .maybeSingle();

  if (!connection) throw new Error("nenhuma conexão WhatsApp Cloud API ativa — conecte um canal primeiro");

  const { data: credentials } = await serviceClient.rpc("get_channel_credentials", {
    p_connection_id: connection.id,
  });

  if (!(credentials as { wabaId?: string } | null)?.wabaId) {
    throw new Error("esta conexão não tem waba_id configurado — edite a conexão em Canais");
  }

  const result = await submitWhatsAppCloudTemplate(credentials as ChannelCredentials, {
    name: template.name,
    language: template.language,
    category: template.category ?? "MARKETING",
    body: template.body,
  });

  if (result.status === "failed") {
    throw new Error(result.error ?? "falha ao submeter template");
  }

  const { error: updateError } = await userClient
    .from("message_templates")
    .update({ status: "pending_review", provider_template_id: result.providerTemplateId })
    .eq("id", templateId);

  if (updateError) throw new Error(updateError.message);
  revalidatePath("/dashboard/templates");
}

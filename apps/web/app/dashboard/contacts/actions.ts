"use server";

import { revalidatePath } from "next/cache";
import { getCurrentOrg } from "@/lib/org";
import { getUserClient } from "@/lib/supabase/server-client";

// MVP: assume número brasileiro quando o DDI não vem digitado. Quando outros
// países entrarem, isto vira um campo de seleção em vez de heurística.
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.startsWith("55") ? `+${digits}` : `+55${digits}`;
}

export async function addContact(formData: FormData): Promise<void> {
  const org = await getCurrentOrg();
  if (!org) throw new Error("sem organização");

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!phone) throw new Error("telefone é obrigatório");

  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const supabase = await getUserClient();

  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .insert({
      organization_id: org.organizationId,
      full_name: fullName || null,
      custom_fields: tags.length > 0 ? { tags } : {},
    })
    .select("id")
    .single();

  if (contactError) throw new Error(contactError.message);

  const { error: channelError } = await supabase.from("contact_channels").insert({
    organization_id: org.organizationId,
    contact_id: contact.id,
    channel: "whatsapp",
    external_id: normalizePhone(phone),
    opt_in: true,
    opt_in_at: new Date().toISOString(),
    opt_in_source: "cadastro manual no painel",
  });

  if (channelError) throw new Error(channelError.message);

  revalidatePath("/dashboard/contacts");
}

export interface ImportResult {
  imported: number;
  skipped: number;
}

/**
 * Parser propositalmente simples: uma linha = uma vírgula separando
 * nome,telefone,tags (tags entre si separadas por ";" pra não colidir com a
 * vírgula das colunas). Não lida com campos entre aspas contendo vírgula —
 * suficiente pra uma planilha exportada só com essas três colunas, não pra
 * CSV arbitrário.
 */
export async function importContactsCsv(_prev: ImportResult | null, formData: FormData): Promise<ImportResult> {
  const org = await getCurrentOrg();
  if (!org) throw new Error("sem organização");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("selecione um arquivo CSV");
  }

  const text = await file.text();
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  // A primeira linha é sempre tratada como cabeçalho e descartada.
  const dataLines = lines.slice(1);

  const supabase = await getUserClient();
  let imported = 0;
  let skipped = 0;

  for (const line of dataLines) {
    const [fullNameRaw, phoneRaw, tagsRaw] = line.split(",");
    const phone = (phoneRaw ?? "").trim();
    if (!phone) {
      skipped++;
      continue;
    }

    const fullName = (fullNameRaw ?? "").trim();
    const tags = (tagsRaw ?? "")
      .split(";")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .insert({
        organization_id: org.organizationId,
        full_name: fullName || null,
        custom_fields: tags.length > 0 ? { tags } : {},
      })
      .select("id")
      .single();

    if (contactError || !contact) {
      skipped++;
      continue;
    }

    const { error: channelError } = await supabase.from("contact_channels").insert({
      organization_id: org.organizationId,
      contact_id: contact.id,
      channel: "whatsapp",
      external_id: normalizePhone(phone),
      opt_in: true,
      opt_in_at: new Date().toISOString(),
      opt_in_source: "importação CSV",
    });

    if (channelError) {
      skipped++;
      continue;
    }

    imported++;
  }

  revalidatePath("/dashboard/contacts");
  return { imported, skipped };
}

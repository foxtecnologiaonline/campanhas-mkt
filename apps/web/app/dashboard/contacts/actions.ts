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

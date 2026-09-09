import type { ChannelCredentials, OutboundMessage, SendResult } from "../types";

const DEFAULT_API_VERSION = "v21.0";

interface GraphApiErrorBody {
  error?: { message?: string; type?: string; code?: number };
}

interface GraphApiSendResponse {
  messages?: Array<{ id: string }>;
}

export async function sendWhatsAppCloudMessage(
  credentials: ChannelCredentials,
  message: OutboundMessage,
): Promise<SendResult> {
  const accessToken = credentials.accessToken;
  const phoneNumberId = credentials.phoneNumberId;
  const apiVersion = credentials.apiVersion ?? DEFAULT_API_VERSION;

  if (!accessToken || !phoneNumberId) {
    return { status: "failed", error: "credenciais incompletas: accessToken e phoneNumberId são obrigatórios" };
  }

  const body = message.templateName
    ? {
        messaging_product: "whatsapp",
        to: message.to,
        type: "template",
        template: {
          name: message.templateName,
          language: { code: message.templateLanguage ?? "pt_BR" },
          ...(message.templateVariables
            ? {
                components: [
                  {
                    type: "body",
                    parameters: Object.values(message.templateVariables).map((text) => ({
                      type: "text",
                      text,
                    })),
                  },
                ],
              }
            : {}),
        },
      }
    : {
        messaging_product: "whatsapp",
        to: message.to,
        type: "text",
        text: { body: message.text ?? "" },
      };

  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as GraphApiErrorBody;
    return {
      status: "failed",
      error: errorBody.error?.message ?? `Graph API respondeu ${response.status}`,
    };
  }

  const data = (await response.json()) as GraphApiSendResponse;
  const providerMessageId = data.messages?.[0]?.id;

  if (!providerMessageId) {
    return { status: "failed", error: "resposta da Graph API sem id de mensagem" };
  }

  return { status: "sent", providerMessageId };
}

export interface TemplateSubmission {
  name: string;
  language: string;
  category: string;
  body: string;
}

export interface TemplateSubmissionResult {
  status: "submitted" | "failed";
  providerTemplateId?: string;
  error?: string;
}

interface GraphApiTemplateResponse {
  id?: string;
}

/**
 * Submete um template pra aprovação da Meta. Implementado a partir da
 * documentação pública (developers.facebook.com/docs/whatsapp/business-management-api/message-templates)
 * mas nunca exercitado contra uma conta real — antes de confiar nisso em
 * produção, testar contra um WABA de verdade e ajustar formato/campos se a
 * resposta da API vier diferente do esperado aqui.
 */
export async function submitWhatsAppCloudTemplate(
  credentials: ChannelCredentials,
  template: TemplateSubmission,
): Promise<TemplateSubmissionResult> {
  const accessToken = credentials.accessToken;
  const wabaId = credentials.wabaId;
  const apiVersion = credentials.apiVersion ?? DEFAULT_API_VERSION;

  if (!accessToken || !wabaId) {
    return { status: "failed", error: "credenciais incompletas: accessToken e wabaId são obrigatórios" };
  }

  const response = await fetch(`https://graph.facebook.com/${apiVersion}/${wabaId}/message_templates`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: template.name,
      language: template.language,
      category: template.category,
      components: [{ type: "BODY", text: template.body }],
    }),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as GraphApiErrorBody;
    return {
      status: "failed",
      error: errorBody.error?.message ?? `Graph API respondeu ${response.status}`,
    };
  }

  const data = (await response.json()) as GraphApiTemplateResponse;
  if (!data.id) {
    return { status: "failed", error: "resposta da Graph API sem id de template" };
  }

  return { status: "submitted", providerTemplateId: data.id };
}

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

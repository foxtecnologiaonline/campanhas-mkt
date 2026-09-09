import type { ChannelCredentials, OutboundMessage, SendResult } from "../types";

interface EvolutionSendResponse {
  key?: { id?: string };
}

interface EvolutionErrorBody {
  message?: string | string[];
}

/**
 * Evolution API não tem o conceito de "template aprovado" da Cloud API — ela
 * simula uma sessão de WhatsApp Web (Baileys) e manda qualquer texto pronto.
 * Por isso este provider exige `message.text`; quem chama send() é
 * responsável por já ter renderizado o corpo do template em texto antes de
 * chegar aqui (ver app/api/cron/dispatch, que ramifica por provider).
 */
export async function sendEvolutionMessage(
  credentials: ChannelCredentials,
  message: OutboundMessage,
): Promise<SendResult> {
  const serverUrl = credentials.serverUrl?.replace(/\/$/, "");
  const instance = credentials.instance;
  const apiKey = credentials.apiKey;

  if (!serverUrl || !instance || !apiKey) {
    return {
      status: "failed",
      error: "credenciais incompletas: serverUrl, instance e apiKey são obrigatórios",
    };
  }

  if (!message.text) {
    return {
      status: "failed",
      error: "Evolution API exige texto pronto (message.text); templates não se aplicam a este provider",
    };
  }

  // Evolution API espera o número com DDI, só dígitos (sem "+", sem sufixo @s.whatsapp.net).
  const number = message.to.replace(/\D/g, "");

  const response = await fetch(`${serverUrl}/message/sendText/${instance}`, {
    method: "POST",
    headers: {
      apikey: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ number, text: message.text }),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as EvolutionErrorBody;
    const message_ = Array.isArray(errorBody.message) ? errorBody.message.join("; ") : errorBody.message;
    return { status: "failed", error: message_ ?? `Evolution API respondeu ${response.status}` };
  }

  const data = (await response.json()) as EvolutionSendResponse;
  const providerMessageId = data.key?.id;

  if (!providerMessageId) {
    return { status: "failed", error: "resposta da Evolution API sem id de mensagem" };
  }

  return { status: "sent", providerMessageId };
}

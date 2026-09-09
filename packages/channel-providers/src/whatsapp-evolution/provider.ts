import type { ChannelCredentials, ChannelProvider, OutboundMessage, SendResult } from "../types";
import { sendEvolutionMessage } from "./client";
import { parseEvolutionWebhook, verifyEvolutionApiKey } from "./webhook";

export const whatsAppEvolutionProvider: ChannelProvider = {
  channel: "whatsapp",
  provider: "whatsapp_evolution",

  send(credentials: ChannelCredentials, message: OutboundMessage): Promise<SendResult> {
    return sendEvolutionMessage(credentials, message);
  },

  // Aqui "assinatura" é o header apikey compartilhado da instância, não um
  // HMAC — ver o comentário em webhook.ts sobre a garantia mais fraca disso.
  verifyWebhookSignature({ signatureHeader, appSecret }) {
    return verifyEvolutionApiKey({ headerApiKey: signatureHeader, expectedApiKey: appSecret });
  },

  parseWebhookPayload: parseEvolutionWebhook,
};

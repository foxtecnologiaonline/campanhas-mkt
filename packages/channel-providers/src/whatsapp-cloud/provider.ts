import type { ChannelCredentials, ChannelProvider, OutboundMessage, SendResult } from "../types";
import { sendWhatsAppCloudMessage } from "./client";
import { parseWhatsAppCloudWebhook, verifyWhatsAppCloudSignature } from "./webhook";

export const whatsAppCloudProvider: ChannelProvider = {
  channel: "whatsapp",
  provider: "whatsapp_cloud",

  send(credentials: ChannelCredentials, message: OutboundMessage): Promise<SendResult> {
    return sendWhatsAppCloudMessage(credentials, message);
  },

  verifyWebhookSignature: verifyWhatsAppCloudSignature,

  parseWebhookPayload: parseWhatsAppCloudWebhook,
};

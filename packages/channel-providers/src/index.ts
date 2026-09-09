export type {
  Channel,
  ChannelCredentials,
  ChannelProvider,
  InboundEvent,
  MessageDeliveryStatus,
  OutboundMessage,
  SendResult,
} from "./types";

export { whatsAppCloudProvider } from "./whatsapp-cloud/provider";
export { whatsAppEvolutionProvider } from "./whatsapp-evolution/provider";

// Específico da Cloud API — submissão de template não existe na Evolution
// API, então não faz parte da interface genérica ChannelProvider.
export { submitWhatsAppCloudTemplate } from "./whatsapp-cloud/client";
export type { TemplateSubmission, TemplateSubmissionResult } from "./whatsapp-cloud/client";

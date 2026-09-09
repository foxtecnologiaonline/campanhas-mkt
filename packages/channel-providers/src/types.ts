export type Channel =
  | "whatsapp"
  | "telegram"
  | "sms"
  | "email"
  | "instagram"
  | "facebook"
  | "wifi"
  | "bluetooth";

/** Credenciais resolvidas de channel_connections + vault, nunca persistidas por este pacote. */
export interface ChannelCredentials {
  [key: string]: string;
}

export interface OutboundMessage {
  /** Identificador do destinatário no canal (telefone E.164 para WhatsApp). */
  to: string;
  /** Fora da janela de 24h, canais como WhatsApp só aceitam templates aprovados. */
  templateName?: string;
  templateLanguage?: string;
  templateVariables?: Record<string, string>;
  /** Texto livre, só válido dentro da janela de sessão do canal. */
  text?: string;
  /**
   * Chave de idempotência do chamador, tipicamente `${campaignId}:${contactId}`.
   * O provider não deduplica sozinho — quem persiste o resultado (o worker)
   * é responsável pela unicidade; esta chave existe para providers que
   * aceitam um id de idempotência na própria API.
   */
  idempotencyKey: string;
}

export type MessageDeliveryStatus = "sent" | "delivered" | "read" | "failed";

export interface SendResult {
  status: "sent" | "failed";
  providerMessageId?: string;
  error?: string;
}

/** Evento normalizado a partir de um webhook de provider, já deduplicado pelo parser. */
export interface InboundEvent {
  type: "status" | "message";
  /** Chave de dedupe estável entre reentregas do mesmo evento pelo provider. */
  providerEventId: string;
  /** Identificador da conexão do canal no provider (ex.: phone_number_id da Cloud API). */
  externalRef: string;
  contactExternalId?: string;
  providerMessageId?: string;
  status?: MessageDeliveryStatus;
  text?: string;
  occurredAt?: Date;
  raw: unknown;
}

export interface ChannelProvider {
  readonly channel: Channel;
  readonly provider: string;

  send(credentials: ChannelCredentials, message: OutboundMessage): Promise<SendResult>;

  /** Verificação de assinatura do webhook; deve usar comparação em tempo constante. */
  verifyWebhookSignature(input: {
    rawBody: string;
    signatureHeader: string | null;
    appSecret: string;
  }): boolean;

  parseWebhookPayload(payload: unknown): InboundEvent[];
}

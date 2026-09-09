import { createHmac, timingSafeEqual } from "node:crypto";
import type { InboundEvent, MessageDeliveryStatus } from "../types";

const STATUS_MAP: Record<string, MessageDeliveryStatus> = {
  sent: "sent",
  delivered: "delivered",
  read: "read",
  failed: "failed",
};

/**
 * Compara `sha256=<hmac hex>` em tempo constante, para não vazar por timing
 * quanto do hash está correto. Assinaturas com tamanho diferente do esperado
 * são rejeitadas sem chamar timingSafeEqual (que exige buffers do mesmo tamanho).
 */
export function verifyWhatsAppCloudSignature(input: {
  rawBody: string;
  signatureHeader: string | null;
  appSecret: string;
}): boolean {
  const { rawBody, signatureHeader, appSecret } = input;
  if (!signatureHeader?.startsWith("sha256=")) return false;

  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest();
  const received = Buffer.from(signatureHeader.slice("sha256=".length), "hex");

  if (received.length !== expected.length) return false;
  return timingSafeEqual(expected, received);
}

interface CloudApiMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
}

interface CloudApiStatus {
  id: string;
  status: string;
  timestamp: string;
  recipient_id: string;
}

interface CloudApiChangeValue {
  metadata?: { phone_number_id?: string };
  messages?: CloudApiMessage[];
  statuses?: CloudApiStatus[];
}

interface CloudApiPayload {
  entry?: Array<{
    changes?: Array<{ value?: CloudApiChangeValue; field?: string }>;
  }>;
}

export function parseWhatsAppCloudWebhook(payload: unknown): InboundEvent[] {
  const events: InboundEvent[] = [];
  const body = payload as CloudApiPayload;

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      const phoneNumberId = value?.metadata?.phone_number_id;
      if (!value || !phoneNumberId) continue;

      for (const message of value.messages ?? []) {
        const text = message.type === "text" ? message.text?.body : undefined;
        events.push({
          type: "message",
          providerEventId: `message:${message.id}`,
          externalRef: phoneNumberId,
          contactExternalId: message.from,
          providerMessageId: message.id,
          ...(text !== undefined ? { text } : {}),
          occurredAt: new Date(Number(message.timestamp) * 1000),
          raw: message,
        });
      }

      for (const status of value.statuses ?? []) {
        const mapped = STATUS_MAP[status.status];
        if (!mapped) continue;
        events.push({
          type: "status",
          providerEventId: `status:${status.id}:${status.status}:${status.timestamp}`,
          externalRef: phoneNumberId,
          contactExternalId: status.recipient_id,
          providerMessageId: status.id,
          status: mapped,
          occurredAt: new Date(Number(status.timestamp) * 1000),
          raw: status,
        });
      }
    }
  }

  return events;
}

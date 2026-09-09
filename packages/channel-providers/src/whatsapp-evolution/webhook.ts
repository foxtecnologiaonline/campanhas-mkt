import { timingSafeEqual } from "node:crypto";
import type { InboundEvent, MessageDeliveryStatus } from "../types";

/**
 * A Evolution API não assina o corpo do webhook com HMAC como a Cloud API —
 * o padrão da própria ferramenta é enviar o header `apikey` com a mesma
 * chave configurada pra instância. Isso é uma garantia bem mais fraca que a
 * assinatura da Meta: quem tiver a apikey (ou capturar a URL do webhook com
 * ela embutida em algum proxy mal configurado) consegue forjar eventos. Fica
 * documentado aqui como limitação conhecida, não escondido atrás do nome
 * "verify" — se a instância real usar outro mecanismo, ajustar só esta
 * função, a interface ChannelProvider não muda.
 */
export function verifyEvolutionApiKey(input: {
  headerApiKey: string | null;
  expectedApiKey: string;
}): boolean {
  const { headerApiKey, expectedApiKey } = input;
  if (!headerApiKey) return false;

  const received = Buffer.from(headerApiKey);
  const expected = Buffer.from(expectedApiKey);
  if (received.length !== expected.length) return false;
  return timingSafeEqual(received, expected);
}

const STATUS_MAP: Record<number, MessageDeliveryStatus> = {
  0: "failed", // ERROR
  2: "sent", // SERVER_ACK
  3: "delivered", // DELIVERY_ACK
  4: "read", // READ
  5: "read", // PLAYED (conta como lida pra nós)
};

interface EvolutionMessageKey {
  id: string;
  remoteJid: string;
  fromMe?: boolean;
}

interface EvolutionUpsertData {
  key: EvolutionMessageKey;
  message?: { conversation?: string; extendedTextMessage?: { text?: string } };
  messageTimestamp?: number;
}

interface EvolutionUpdateItem {
  key: EvolutionMessageKey;
  update?: { status?: number };
}

interface EvolutionWebhookPayload {
  event?: string;
  instance?: string;
  data?: unknown;
}

function stripJidSuffix(remoteJid: string): string {
  return remoteJid.split("@")[0] ?? remoteJid;
}

/**
 * IMPORTANTE: baseado no contrato documentado da Evolution API v2
 * (github.com/EvolutionAPI/evolution-api) para os eventos `messages.upsert`
 * e `messages.update`. Esse projeto já teve mudanças de formato entre
 * versões — antes de ligar isto contra a instância real do ZapScript,
 * validar com um payload de webhook de verdade e ajustar os campos abaixo
 * se necessário. O resto do pipeline (dedupe, RLS, RPCs de envio) não muda.
 */
export function parseEvolutionWebhook(payload: unknown): InboundEvent[] {
  const body = payload as EvolutionWebhookPayload;
  const instance = body.instance;
  if (!instance) return [];

  if (body.event === "messages.upsert") {
    const data = body.data as EvolutionUpsertData | undefined;
    if (!data?.key || data.key.fromMe) return [];

    const text = data.message?.conversation ?? data.message?.extendedTextMessage?.text;

    return [
      {
        type: "message",
        providerEventId: `message:${data.key.id}`,
        externalRef: instance,
        contactExternalId: stripJidSuffix(data.key.remoteJid),
        providerMessageId: data.key.id,
        ...(text !== undefined ? { text } : {}),
        occurredAt: data.messageTimestamp ? new Date(data.messageTimestamp * 1000) : new Date(),
        raw: data,
      },
    ];
  }

  if (body.event === "messages.update") {
    const items = Array.isArray(body.data) ? (body.data as EvolutionUpdateItem[]) : [body.data as EvolutionUpdateItem];

    return items.flatMap((item): InboundEvent[] => {
      const statusCode = item?.update?.status;
      if (!item?.key || statusCode === undefined) return [];

      const mapped = STATUS_MAP[statusCode];
      if (!mapped) return [];

      return [
        {
          type: "status",
          providerEventId: `status:${item.key.id}:${statusCode}`,
          externalRef: instance,
          contactExternalId: stripJidSuffix(item.key.remoteJid),
          providerMessageId: item.key.id,
          status: mapped,
          raw: item,
        },
      ];
    });
  }

  return [];
}

import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { parseWhatsAppCloudWebhook, verifyWhatsAppCloudSignature } from "./webhook";

describe("verifyWhatsAppCloudSignature", () => {
  const appSecret = "test-app-secret";
  const rawBody = JSON.stringify({ hello: "world" });

  function sign(secret: string, body: string): string {
    return `sha256=${createHmac("sha256", secret).update(body, "utf8").digest("hex")}`;
  }

  it("aceita uma assinatura válida", () => {
    const ok = verifyWhatsAppCloudSignature({
      rawBody,
      signatureHeader: sign(appSecret, rawBody),
      appSecret,
    });
    expect(ok).toBe(true);
  });

  it("rejeita assinatura calculada com o segredo errado", () => {
    const ok = verifyWhatsAppCloudSignature({
      rawBody,
      signatureHeader: sign("segredo-errado", rawBody),
      appSecret,
    });
    expect(ok).toBe(false);
  });

  it("rejeita corpo adulterado após a assinatura ser calculada", () => {
    const signature = sign(appSecret, rawBody);
    const ok = verifyWhatsAppCloudSignature({
      rawBody: JSON.stringify({ hello: "world-adulterado" }),
      signatureHeader: signature,
      appSecret,
    });
    expect(ok).toBe(false);
  });

  it("rejeita header ausente ou em formato inesperado", () => {
    expect(verifyWhatsAppCloudSignature({ rawBody, signatureHeader: null, appSecret })).toBe(false);
    expect(
      verifyWhatsAppCloudSignature({ rawBody, signatureHeader: "md5=abcdef", appSecret }),
    ).toBe(false);
  });
});

describe("parseWhatsAppCloudWebhook", () => {
  it("extrai mensagem inbound e evento de status com providerEventId estável", () => {
    const payload = {
      entry: [
        {
          changes: [
            {
              field: "messages",
              value: {
                metadata: { phone_number_id: "PHONE_123" },
                messages: [
                  {
                    from: "5511999999999",
                    id: "wamid.MSG1",
                    timestamp: "1700000000",
                    type: "text",
                    text: { body: "Oi, quero saber mais" },
                  },
                ],
                statuses: [
                  {
                    id: "wamid.MSG0",
                    status: "delivered",
                    timestamp: "1700000001",
                    recipient_id: "5511999999999",
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const events = parseWhatsAppCloudWebhook(payload);

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      type: "message",
      providerEventId: "message:wamid.MSG1",
      externalRef: "PHONE_123",
      contactExternalId: "5511999999999",
      text: "Oi, quero saber mais",
    });
    expect(events[1]).toMatchObject({
      type: "status",
      providerEventId: "status:wamid.MSG0:delivered:1700000001",
      externalRef: "PHONE_123",
      status: "delivered",
    });
  });

  it("ignora status com valor desconhecido em vez de quebrar o processamento", () => {
    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                metadata: { phone_number_id: "PHONE_123" },
                statuses: [
                  { id: "wamid.X", status: "warming", timestamp: "1700000000", recipient_id: "555" },
                ],
              },
            },
          ],
        },
      ],
    };

    expect(parseWhatsAppCloudWebhook(payload)).toHaveLength(0);
  });

  it("ignora mudanças sem phone_number_id (não dá pra resolver o tenant)", () => {
    const payload = {
      entry: [{ changes: [{ value: { messages: [{ from: "5", id: "1", timestamp: "1", type: "text" }] } }] }],
    };

    expect(parseWhatsAppCloudWebhook(payload)).toHaveLength(0);
  });
});

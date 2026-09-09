import { describe, expect, it } from "vitest";
import { parseEvolutionWebhook, verifyEvolutionApiKey } from "./webhook";

describe("verifyEvolutionApiKey", () => {
  it("aceita quando o header bate com a apikey esperada", () => {
    expect(verifyEvolutionApiKey({ headerApiKey: "chave-123", expectedApiKey: "chave-123" })).toBe(true);
  });

  it("rejeita apikey errada", () => {
    expect(verifyEvolutionApiKey({ headerApiKey: "chave-errada", expectedApiKey: "chave-123" })).toBe(false);
  });

  it("rejeita header ausente", () => {
    expect(verifyEvolutionApiKey({ headerApiKey: null, expectedApiKey: "chave-123" })).toBe(false);
  });
});

describe("parseEvolutionWebhook", () => {
  it("extrai mensagem inbound de messages.upsert, ignorando mensagens enviadas por nós (fromMe)", () => {
    const inbound = parseEvolutionWebhook({
      event: "messages.upsert",
      instance: "instancia-fox",
      data: {
        key: { id: "3EB0MSG1", remoteJid: "5511999999999@s.whatsapp.net", fromMe: false },
        message: { conversation: "Quero saber mais" },
        messageTimestamp: 1700000000,
      },
    });

    expect(inbound).toHaveLength(1);
    expect(inbound[0]).toMatchObject({
      type: "message",
      providerEventId: "message:3EB0MSG1",
      externalRef: "instancia-fox",
      contactExternalId: "5511999999999",
      text: "Quero saber mais",
    });

    const own = parseEvolutionWebhook({
      event: "messages.upsert",
      instance: "instancia-fox",
      data: {
        key: { id: "3EB0MSG2", remoteJid: "5511999999999@s.whatsapp.net", fromMe: true },
        message: { conversation: "eco da nossa própria mensagem" },
      },
    });
    expect(own).toHaveLength(0);
  });

  it("mapeia status numérico do messages.update para o status normalizado", () => {
    const events = parseEvolutionWebhook({
      event: "messages.update",
      instance: "instancia-fox",
      data: [
        { key: { id: "3EB0MSG1", remoteJid: "5511999999999@s.whatsapp.net" }, update: { status: 3 } },
      ],
    });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "status",
      providerEventId: "status:3EB0MSG1:3",
      externalRef: "instancia-fox",
      status: "delivered",
    });
  });

  it("ignora eventos sem instance (não dá pra resolver o tenant)", () => {
    expect(parseEvolutionWebhook({ event: "messages.upsert", data: {} })).toHaveLength(0);
  });

  it("ignora eventos de tipo desconhecido", () => {
    expect(parseEvolutionWebhook({ event: "connection.update", instance: "instancia-fox" })).toHaveLength(0);
  });
});

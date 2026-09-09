# Análise de Preços: Meta Oficial vs Evolution API vs Campanhas MKT

## Contexto

O cliente tem 3 opções:
1. **Contratar direto com Meta** - R$ 0,33/mensagem
2. **Usar Evolution API** - R$ 0,008-0,012/mensagem
3. **Usar Campanhas MKT** - Nosso modelo de precificação

---

## 1. Quando Cliente Contrata Direto com Meta (R$ 0,33/msg)

### 1.1 Meu Custo Operacional

Se o cliente usar nosso sistema mas pagar direto com Meta:

| Item | Custo |
|------|-------|
| Meta API | R$ 0,33 |
| Infrastructure overhead | R$ 0,02 |
| Storage & Logs | R$ 0,015 |
| Payment processing (2.99%) | R$ 0,01 |
| **Custo Total** | **R$ 0,375/mensagem** |

### 1.2 Estratégia de Precificação

**Opção A: Model de Assinatura + Comissão**

```
Cobro do cliente:
- Assinatura: R$ 99-299/mês (acesso à plataforma)
- Comissão sobre volume: 15-25% do custo Meta

Exemplo com 1.000.000 msgs/mês:
- Assinatura: R$ 299
- Custo Meta para cliente: 1.000.000 × R$ 0,33 = R$ 330.000
- Comissão minha (20%): R$ 66.000
- Total que cliente paga: R$ 330.000 + R$ 299 = R$ 330.299

Meu lucro: R$ 66.000 - R$ 375.000 = PREJUÍZO ❌
```

**Problema:** Com Meta em R$ 0,33, é impossível lucrar com comissão.

---

## 2. Cenário: Cliente usa EVOLUTION API

### 2.1 Meu Custo

| Item | Custo |
|------|-------|
| Evolution API | R$ 0,010 |
| Infrastructure overhead | R$ 0,025 |
| Storage & Logs | R$ 0,015 |
| Payment processing | R$ 0,01 |
| **Custo Total** | **R$ 0,060/mensagem** |

### 2.2 Meu Preço de Venda

```
Preço por mensagem: R$ 0,12 (2x o custo)

Margem por mensagem:
(R$ 0,12 - R$ 0,06) / R$ 0,12 = 50% margem ✅

Para 1.000.000 msgs/mês:
Receita: 1.000.000 × R$ 0,12 = R$ 120.000
Custo: 1.000.000 × R$ 0,06 = R$ 60.000
Lucro: R$ 60.000 (50% margem) ✅
```

### 2.3 Comparação com Meta para Cliente

| Métrica | Meta Direto | Campanhas MKT (Evolution) |
|---------|------------|--------------------------|
| Preço por msg | R$ 0,33 | R$ 0,12 |
| Economia | - | **63.6% mais barato** |
| 1M msgs/mês | R$ 330.000 | R$ 120.000 |
| Economia anual | - | **R$ 2.520.000** |

---

## 3. Cenário: Cliente usa CAMPANHAS MKT (Modelo Tier)

### 3.1 Estrutura de Precificação Recomendada

**Para clientes que querem usar Evolution API conosco:**

```typescript
TIER PRICING (usando Evolution):
{
  STARTER: {
    monthlyPrice: R$ 99,
    messagesIncluded: 1.000,
    pricePerExtraMessage: R$ 0,12,
    profitMargin: 50%
  },
  PROFESSIONAL: {
    monthlyPrice: R$ 299,
    messagesIncluded: 10.000,
    pricePerExtraMessage: R$ 0,10,
    profitMargin: 60%
  },
  ENTERPRISE: {
    monthlyPrice: R$ 2.000-5.000,
    messagesIncluded: Negociado,
    pricePerExtraMessage: R$ 0,08,
    profitMargin: 70%
  }
}
```

### 3.2 Exemplo de Cliente Professional

**Perfil:** Agência que envia 500.000 msgs/mês

**Faturamento:**
```
Assinatura: R$ 299
Mensagens extras: (500.000 - 10.000) × R$ 0,10 = R$ 49.000
Total cliente paga: R$ 49.299

Meu custo:
500.000 msgs × R$ 0,06 = R$ 30.000

Meu lucro: R$ 49.299 - R$ 30.000 = R$ 19.299 (39% margem) ✅
```

---

## 4. Comparação: META vs EVOLUTION vs CAMPANHAS MKT

### 4.1 Exemplo: 100.000 msgs/mês

| Cenário | Preço/Msg | Total/Mês | Cliente Paga | Meu Lucro |
|---------|-----------|-----------|-------------|-----------|
| **Meta Direto** | R$ 0,33 | R$ 33.000 | R$ 33.000 | R$ 0* |
| **Evolution (puro)** | R$ 0,12 | R$ 12.000 | R$ 12.000 | R$ 6.000 |
| **Campanhas (Starter)** | R$ 0,12 + taxa | R$ 12.099 | R$ 12.099 | R$ 6.099 |

*Se vender apenas acesso a Evolution, sem adicionar valor (modelo não viável)

### 4.2 Exemplo: 1.000.000 msgs/mês

| Cenário | Cliente Paga | Meu Custo | Meu Lucro | Margem |
|---------|-------------|-----------|-----------|--------|
| **Meta Direto** | R$ 330.000 | R$ 375.000 | -R$ 45.000 | -13.6% ❌ |
| **Evolution (puro)** | R$ 120.000 | R$ 60.000 | R$ 60.000 | 50% ✅ |
| **Campanhas (Prof.)** | R$ 49.299 | R$ 30.000 | R$ 19.299 | 39% ✅ |

---

## 5. Estratégia Recomendada

### 5.1 Matriz de Decisão por Cliente

```
┌─────────────────────────────────────────────────┐
│ Volume de mensagens do cliente?                 │
└─────────────────────────────────────────────────┘
           ↓
    ┌──────────────────────────────┐
    │ < 10k msgs/mês               │  → Meta Direto*
    └──────────────────────────────┘
           ↓
    ┌──────────────────────────────┐
    │ 10k - 1M msgs/mês            │  → Campanhas MKT
    │                              │    (Starter/Pro)
    └──────────────────────────────┘
           ↓
    ┌──────────────────────────────┐
    │ > 1M msgs/mês                │  → Enterprise +
    │                              │    Desconto volume
    └──────────────────────────────┘

* Explicar que Meta é mais caro (R$ 0,33)
```

### 5.2 Proposta de Valor

**Para cliente pequeno (<10k msgs):**
- "Comece com Meta direto, migramos você depois"

**Para cliente médio (10k-1M msgs):**
- "Use Campanhas MKT com Evolution: economize 63% vs Meta"
- Starter: R$ 99 + R$ 0,12/msg extra
- Professional: R$ 299 + R$ 0,10/msg extra

**Para cliente grande (>1M msgs):**
- "Enterprise: R$ 2.000/mês + R$ 0,08/msg"
- "Economia: até 75% vs Meta direto"

---

## 6. Análise de Concorrência: Como Vender vs Meta

### 6.1 Por que usar Campanhas MKT em vez de Meta Direto?

| Vantagem | Descrição | Valor |
|----------|-----------|-------|
| **63% mais barato** | R$ 0,12 vs R$ 0,33 | R$ 210.000/ano (1M msgs) |
| **Platform único** | SMS, Email, WhatsApp | Integração centralizada |
| **Relatórios avançados** | Analytics detalhado | Insights de negócio |
| **Suporte dedicado** | Chat 24h | Tranquilidade |
| **Sem setup técnico** | Plug & play | Economia de tempo |
| **Escalabilidade** | Auto-scaling | Crescimento ilimitado |

### 6.2 Argumentação de Venda

```
"Usando Meta direto você paga R$ 0,33/mensagem.
Com a Campanhas MKT você paga R$ 0,12.

Exemplo: 1.000.000 msgs/mês
- Meta: R$ 330.000/mês
- Campanhas: R$ 120.000/mês
- VOCÊ ECONOMIZA: R$ 210.000/mês

Isso é R$ 2.520.000 de economia por ano!"
```

---

## 7. Modelo de Precificação Final (Recomendado)

### 7.1 Tiers Revisados

```typescript
PRICING_TIERS = {
  STARTER: {
    monthlyPrice: R$ 99,
    includesMessages: 1.000,
    pricePerExtra: R$ 0,12,
    costPerMessage: R$ 0,060,
    marginPerMessage: R$ 0,060,
    marginPercentage: 50%,
    targetAudience: "Startups, pequenas empresas"
  },
  
  PROFESSIONAL: {
    monthlyPrice: R$ 299,
    includesMessages: 10.000,
    pricePerExtra: R$ 0,10,
    costPerMessage: R$ 0,060,
    marginPerMessage: R$ 0,040,
    marginPercentage: 60%,
    targetAudience: "Agências, empresas médias"
  },
  
  ENTERPRISE: {
    monthlyPrice: R$ 3.000,
    includesMessages: 100.000,
    pricePerExtra: R$ 0,08,
    costPerMessage: R$ 0,060,
    marginPerMessage: R$ 0,020,
    marginPercentage: 70%,
    targetAudience: "Grandes corporações",
    features: "Tudo + Account Manager + Custom API"
  }
}
```

### 7.2 Scenario: Cliente quer Meta Oficial

**Situação:** Cliente insiste em Meta oficial (R$ 0,33/msg)

**Opção 1: Revendedor Meta**
```
- Me registro como Partner Meta
- Compro créditos em lote (1.5M msgs/mês)
- Revendo com 5-10% markup
- Meu custo: R$ 0,33 - desconto volume
- Meu preço: R$ 0,35-0,36
- Margem: 3-6% (muito baixa, não recomendo)
```

**Opção 2: Sugerir Migration Plan**
```
"Entendo que quer Meta oficial. Mas veja:

Meta Direto: R$ 330.000/mês (1M msgs)
Campanhas: R$ 120.000/mês
Economia: R$ 210.000/mês!

Se ainda quer Meta, posso:
1. Integrar sua conta Meta na nossa plataforma
2. Cobrar apenas pela plataforma: R$ 99-299/mês
3. Você paga Meta direto
4. Você aproveita nossa interface/relatórios"

Meu lucro: R$ 99-299 (muito baixo)
Mas evita perder cliente
```

---

## 8. Decisão: Qual Modelo Usar?

### 8.1 Recomendação Estratégica

| Situação | Ação |
|----------|------|
| Cliente quer Meta oficial | Oferecer integração (R$ 99-299/mês) |
| Cliente quer economizar | Vender Campanhas + Evolution |
| Cliente médio | Professional tier (melhor margem) |
| Cliente grande (>5M) | Enterprise com desconto negociado |

### 8.2 Projeção de Receita: Modelo Híbrido

```
100 clientes Campanhas MKT (Evolution):
- 60 Starter (5k msgs médio): 60 × R$ 99 + (60 × 5k × R$ 0,12) = R$ 42.000 receita/mês
- 30 Professional (200k msgs): 30 × R$ 299 + (30 × 190k × R$ 0,10) = R$ 579.000 receita/mês
- 10 Enterprise (1M msgs): 10 × R$ 3.000 + (10 × 900k × R$ 0,08) = R$ 750.000 receita/mês

Total Receita: R$ 1.371.000/mês
Total Custo: ~R$ 600.000/mês
Lucro: R$ 771.000/mês (56% margem)

Vs se vendesse apenas acesso Meta:
Total Receita: R$ 0 (sem margem)
Total Custo: R$ 600.000/mês
Lucro: -R$ 600.000/mês ❌
```

---

## 9. Implementação Técnica

### 9.1 Suportar Múltiplos Providers

```typescript
export enum MessageProvider {
  META = 'meta',           // R$ 0,33/msg (integração cliente)
  EVOLUTION = 'evolution', // R$ 0,008-0,012/msg
  ZENVIA = 'zenvia',       // Para SMS depois
}

export interface CustomerBilling {
  customerId: string;
  provider: MessageProvider;
  billingModel: 'tier' | 'metering' | 'hybrid';
  
  // Se hybrid: cliente paga direto Meta + taxa de plataforma
  platformFee?: {
    monthlyRate: number;
    cursorMarkup?: number; // Para quando revenda Meta
  };
}

// No cálculo de invoice:
if (customer.provider === MessageProvider.EVOLUTION) {
  // Cobrar pelo nosso preço (R$ 0,10-0,12)
  extraMessages × pricePerMessage
} else if (customer.provider === MessageProvider.META) {
  // Cobrar apenas a taxa de plataforma
  platformFee
}
```

---

## 10. Conclusão

### 10.1 Resposta Direta

**Se cliente contrata Meta (R$ 0,33/msg):**

| Modelo | Meu Custo | Meu Preço | Meu Lucro |
|--------|-----------|-----------|-----------|
| Só acesso Meta | R$ 0,33 | R$ 0,35-0,36 | R$ 0,02-0,03 (3-6%) ❌ |
| Taxa plataforma | R$ 0,02* | R$ 99-299/mês | R$ 50-200/mês ⚠️ |
| Migrar Evolution | R$ 0,06 | R$ 0,12 | R$ 0,06 (50%) ✅ |

*Só infraestrutura (sem custo da API)

### 10.2 Melhor Estratégia

1. **Empurar Evolution:** "63% mais barato, mesma qualidade"
2. **Se insistirem Meta:** Cobrar taxa mensal (R$ 99-299)
3. **Não revender Meta:** Margem é muito baixa
4. **Focar em Evolution:** Margin de 50-70%

### 10.3 Pricing Final Recomendado

```
STARTER (Evolution):
- R$ 99/mês + 1.000 msgs
- Extra: R$ 0,12/msg
- Lucro: ~50% margem

PROFESSIONAL (Evolution):
- R$ 299/mês + 10.000 msgs
- Extra: R$ 0,10/msg
- Lucro: ~60% margem

ENTERPRISE (Evolution):
- R$ 3.000/mês + 100.000 msgs
- Extra: R$ 0,08/msg
- Lucro: ~70% margem
- Account Manager incluído

META DIRETO (híbrido):
- R$ 199/mês (taxa plataforma)
- Cliente paga Meta diretamente
- Meu lucro: ~50% (apenas da taxa)
```

---

**Versão**: 1.0  
**Data**: 2026-09-09  
**Recomendação**: Usar Evolution API como default

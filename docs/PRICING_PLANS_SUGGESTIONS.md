# Sugestão de Preços: Plano Mensal vs Plano de 1.000 Mensagens

## 1. Análise de Base

### 1.1 Custos Operacionais

**Por Mensagem (usando Evolution API):**
```
Evolution API:          R$ 0,010/msg
Infrastructure:         R$ 0,025/msg
Storage & Logs:         R$ 0,015/msg
Payment Processing:     R$ 0,010/msg (2.99% + R$ 0,30)
─────────────────────────────────
Total:                  R$ 0,060/msg
```

**Custos Fixos Mensais:**
- Plataforma (Vercel, Supabase): R$ 1.500
- Suporte/Ops: R$ 2.000
- **Total Fixo: R$ 3.500**

### 1.2 Margem Esperada
- Starter/Trial: 40-50%
- Standard: 50-60%
- Enterprise: 60-70%

---

## 2. PLANO 1: 1.000 MENSAGENS (One-time / Pré-pago)

### 2.1 Análise de Custo

**Custo para você:**
```
1.000 msgs × R$ 0,060 = R$ 60
Taxa de processamento (Stripe): R$ 4,47 (2.99% + R$ 0,30)
Suporte/overhead: R$ 15
─────────────────────
Total custo: R$ 79,47
```

### 2.2 Sugestões de Preço (Com diferentes margens)

| Margem | Preço | Lucro | Recomendação |
|--------|-------|-------|--------------|
| 30% | R$ 113 | R$ 33,53 | ❌ Baixo |
| 50% | R$ 158 | R$ 78,53 | ✅ Intermediário |
| 67% | R$ 239 | R$ 159,53 | ✅ **Recomendado** |
| 100% | R$ 318 | R$ 238,53 | ❌ Muito alto |

### 2.3 **RECOMENDAÇÃO: R$ 239 por 1.000 mensagens**

**Por quê:**
- ✅ Preço round (R$ 239 vs R$ 158)
- ✅ Margem de 67% (saudável)
- ✅ Posicionamento premium vs Competition
- ✅ Lucro por transação: R$ 159,53
- ✅ Cliente economiza 24% vs Meta (R$ 314 vs R$ 239)

**Estrutura de Preços (Sugestão):**
```
1.000 mensagens:       R$ 239 (R$ 0,239/msg)
5.000 mensagens:       R$ 1.095 (R$ 0,219/msg, 8% desconto)
10.000 mensagens:      R$ 2.090 (R$ 0,209/msg, 12% desconto)
50.000 mensagens:      R$ 9.950 (R$ 0,199/msg, 17% desconto)
```

---

## 3. PLANO 2: MENSAL (Recurring / Assinatura)

### 3.1 Custos Fixos Mensais

```
Plataforma base:        R$ 3.500
Por cliente (suporte):  R$ 30-100/mês
```

### 3.2 Sugestões de Preço por Tier

#### TIER 1: STARTER (Micro)

**Perfil:** Freelancers, pequenos negócios, testes
- Mensagens incluídas: 1.000/mês
- Custo para você: (1.000 × R$ 0,060) + R$ 30 = R$ 90
- Margem desejada: 50%
- **PREÇO: R$ 180/mês**

**Breakdown:**
```
Preço: R$ 180
Custo: R$ 90
Lucro: R$ 90
Margem: 50% ✅
```

#### TIER 2: PROFESSIONAL (Small/Medium Business)

**Perfil:** Agências, PMEs, campaigns regulares
- Mensagens incluídas: 10.000/mês
- Custo para você: (10.000 × R$ 0,060) + R$ 50 = R$ 650
- Margem desejada: 55%
- **PREÇO: R$ 1.455/mês**

**Breakdown:**
```
Preço: R$ 1.455
Custo: R$ 650
Lucro: R$ 805
Margem: 55% ✅
Custo/msg incluído: R$ 0,1455 (76% desconto vs Meta)
```

#### TIER 3: ENTERPRISE (Large)

**Perfil:** Grandes corporações, volumes altos
- Mensagens incluídas: 100.000/mês
- Custo para você: (100.000 × R$ 0,060) + R$ 100 = R$ 6.100
- Margem desejada: 60%
- **PREÇO: R$ 15.250/mês**

**Breakdown:**
```
Preço: R$ 15.250
Custo: R$ 6.100
Lucro: R$ 9.150
Margem: 60% ✅
Custo/msg incluído: R$ 0,1525 (51% desconto vs Meta)
```

### 3.3 Resumo Planos Mensais

| Tier | Preço/Mês | Msgs/Mês | Margem | Lucro/Mês | R$/msg |
|------|-----------|----------|--------|-----------|--------|
| **Starter** | **R$ 180** | 1.000 | 50% | R$ 90 | R$ 0,180 |
| **Professional** | **R$ 1.455** | 10.000 | 55% | R$ 805 | R$ 0,146 |
| **Enterprise** | **R$ 15.250** | 100.000 | 60% | R$ 9.150 | R$ 0,153 |

---

## 4. COMPARAÇÃO: 1.000 MSGS

### 4.1 Qual Plan Escolher para 1.000 Mensagens?

#### Opção A: Plano One-time (1.000 msgs)
```
Preço: R$ 239
Validade: Sem prazo (não expira)
Ideal para: Testes, pontuais
```

#### Opção B: Plano Mensal Starter
```
Preço: R$ 180/mês
Inclui: 1.000 msgs + acesso ilimitado
Ideal para: Uso recorrente
```

**Recomendação:**
- **Cliente usa 1x/mês:** Plano Mensal (R$ 180)
- **Cliente usa pontualmente:** Plano One-time (R$ 239)
- **Cliente usa 2-3x/mês:** Plano Professional (R$ 1.455, muito melhor valor)

---

## 5. ESTRATÉGIA COMPLETA DE PRICING

### 5.1 Matriz de Opções

```
CLIENTE ESCOLHE:

┌─────────────────────────────────────────┐
│ 1. Créditos Pré-pagos (Pay-as-you-go)  │
├─────────────────────────────────────────┤
│ 1.000 msgs:      R$ 239                │
│ 5.000 msgs:      R$ 1.095              │
│ 10.000 msgs:     R$ 2.090              │
│ 50.000 msgs:     R$ 9.950              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 2. Assinatura Mensal (Recurring)        │
├─────────────────────────────────────────┤
│ Starter:         R$ 180/mês             │
│ Professional:    R$ 1.455/mês           │
│ Enterprise:      R$ 15.250/mês          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 3. Mensagens Extra (Add-on)             │
├─────────────────────────────────────────┤
│ Após esgotar incluídas: R$ 0,15/msg     │
└─────────────────────────────────────────┘
```

---

## 6. COMPARAÇÃO COM CONCORRÊNCIA

### 6.1 vs Meta Oficial

| Solução | Preço 1k msgs | Preço 10k msgs | Economia |
|---------|--------------|----------------|----------|
| **Meta** | R$ 314 | R$ 3.140 | — |
| **Campanhas MKT (1-time)** | **R$ 239** | **R$ 2.090** | **24-33%** ✅ |
| **Campanhas MKT (Starter)** | R$ 180/mês | — | **43% (mensal)** ✅ |

### 6.2 vs Evolution API (puro)

| Solução | Preço 1k msgs | Margem |
|---------|--------------|--------|
| **Evolution (só API)** | R$ 60 | —  |
| **Campanhas MKT** | **R$ 239** | **67%** ✅ |
| **Markup** | — | **300%** 🚀 |

---

## 7. MODELO DE RECEITA PROJETADO (1.000 clientes)

### 7.1 Mix de Clientes (Distribuição Esperada)

```
40% Starter (400 clientes):
├─ 400 × R$ 180 = R$ 72.000/mês
└─ Lucro: R$ 36.000

40% Professional (400 clientes):
├─ 400 × R$ 1.455 = R$ 582.000/mês
└─ Lucro: R$ 322.000

15% Enterprise (150 clientes):
├─ 150 × R$ 15.250 = R$ 2.287.500/mês
└─ Lucro: R$ 1.372.500

5% Pay-as-you-go (50 clientes × R$ 239 médio):
├─ 50 × R$ 239 × 4 (mensalmente) = R$ 47.800/mês
└─ Lucro: R$ 31.867
```

**TOTAL MENSAL:**
```
Receita: R$ 2.989.300/mês
Custos: ~R$ 1.200.000
Lucro: R$ 1.789.300 (59,8% margem)
```

---

## 8. RECOMENDAÇÃO FINAL

### ✅ OFERECER AMBOS OS PLANOS

```
PLAN A: 1.000 MENSAGENS (One-time)
├─ Preço: R$ 239
├─ Margem: 67%
├─ Ideal para: Testes, uso pontual
└─ CTA: "Comece agora"

PLAN B: STARTER MENSAL
├─ Preço: R$ 180/mês
├─ Inclui: 1.000 msgs + ilimitado acesso
├─ Margem: 50%
├─ Ideal para: Uso recorrente
└─ CTA: "Plano mais popular"

PLAN C: PROFESSIONAL MENSAL (Popular)
├─ Preço: R$ 1.455/mês
├─ Inclui: 10.000 msgs + suporte chat
├─ Margem: 55%
├─ Ideal para: Agências, PMEs
└─ CTA: "Melhor custo-benefício"
```

### 📊 Tabela de Decisão (Para Cliente)

**Para descobrir melhor plan:**

```
Q: Você precisa enviar quantas mensagens por mês?

├─ Até 500 msgs → Compre R$ 239 (1.000 msgs one-time)
├─ 500-2.000 msgs → Starter (R$ 180/mês)
├─ 2.000-20.000 msgs → Professional (R$ 1.455/mês) ⭐
├─ 20.000-100.000 msgs → Enterprise (R$ 15.250/mês)
└─ 100.000+ msgs → Contato (desconto customizado)
```

---

## 9. Estratégia de Conversão

### 9.1 Funil de Vendas

```
Free Trial (100 msgs grátis)
        ↓
Starter (R$ 180/mês)
        ↓
Professional (R$ 1.455/mês) ← Maior conversão aqui
        ↓
Enterprise (Customizado)
```

### 9.2 Posicionamento

**Headline:** "Envie campanhas 24% mais barato que Meta"

**Subheadline:** "Comece com R$ 239 por 1.000 mensagens ou R$ 180/mês com ilimitado acesso"

---

## 10. Próximos Passos

- [ ] Implementar 2 planos (1k msgs + Starter mensal)
- [ ] Configurar Stripe com ambos
- [ ] Criar landing page com comparação
- [ ] Setup de webhooks para gerenciar créditos
- [ ] Criar dashboard de uso para cliente

---

**Versão**: 1.0  
**Data**: 2026-09-09  
**Recomendação**: R$ 239 (1k msgs) + R$ 180/mês (Starter)

# 3 Planos com 50% Desconto vs Meta

## 1. Premissas

**Meta (Brasil):**
- Custo médio: R$ 0,314/msg (70% marketing 1ª + 30% sequente)
- 50% desconto = R$ 0,157/msg (preço máximo)

**Seus custos operacionais:**
- Evolution API: R$ 0,010/msg
- Infrastructure: R$ 0,025/msg
- Storage/Logs: R$ 0,015/msg
- Payment processing: R$ 0,010/msg
- **Total: R$ 0,060/msg**

**Custos fixos:**
- Plataforma: R$ 3.500/mês
- Overhead operacional: R$ 30-100/cliente

---

## 2. PLANO 1: 1.000 MENSAGENS

### 2.1 Cálculo com 50% Desconto

```
Meta custa: 1.000 × R$ 0,314 = R$ 314
50% desconto = R$ 157

Seu custo: 1.000 × R$ 0,060 = R$ 60
Margem bruta: R$ 157 - R$ 60 = R$ 97
Margem %: 61,8% ✅
```

### 2.2 PREÇO RECOMENDADO: **R$ 157**

**Estrutura:**
```
1.000 msgs:   R$ 157  (R$ 0,157/msg)  → Seu lucro: R$ 97
5.000 msgs:   R$ 735  (R$ 0,147/msg)  → Seu lucro: R$ 435  (8% desc)
10.000 msgs:  R$ 1.375 (R$ 0,138/msg) → Seu lucro: R$ 815  (12% desc)
```

**Vantagem para cliente:**
```
1.000 msgs:
├─ Meta: R$ 314
├─ Você: R$ 157
└─ Economia: 50% ✅
```

---

## 3. PLANO 2: 10.000 MENSAGENS

### 3.1 Cálculo com 50% Desconto

```
Meta custa: 10.000 × R$ 0,314 = R$ 3.140
50% desconto = R$ 1.570

Seu custo: 10.000 × R$ 0,060 = R$ 600
Margem bruta: R$ 1.570 - R$ 600 = R$ 970
Margem %: 61,8% ✅
```

### 3.2 PREÇO RECOMENDADO: **R$ 1.570**

**Estrutura:**
```
10.000 msgs:  R$ 1.570 (R$ 0,157/msg)  → Seu lucro: R$ 970
50.000 msgs:  R$ 7.100 (R$ 0,142/msg)  → Seu lucro: R$ 4.300  (10% desc)
100.000 msgs: R$ 13.500 (R$ 0,135/msg) → Seu lucro: R$ 7.950  (14% desc)
```

**Vantagem para cliente:**
```
10.000 msgs:
├─ Meta: R$ 3.140
├─ Você: R$ 1.570
└─ Economia: 50% ✅
```

---

## 4. PLANO 3: MENSAL (Variável por Volume)

### 4.1 Questão: Qual é o Uso Médio?

O preço mensal ideal depende de quanto o cliente médio enviar. Vou apresentar 3 cenários:

#### CENÁRIO A: Cliente Médio = 5.000 msgs/mês

**Baseline Meta:**
```
5.000 msgs × R$ 0,314 = R$ 1.570/mês
```

**Com 50% desconto = R$ 785/mês**

```
Seu custo: 5.000 × R$ 0,060 + R$ 50 (overhead) = R$ 350
Margem: R$ 785 - R$ 350 = R$ 435
Margem %: 55,4% ✅
```

**PREÇO RECOMENDADO (5k avg): R$ 785/mês**

---

#### CENÁRIO B: Cliente Médio = 10.000 msgs/mês

**Baseline Meta:**
```
10.000 msgs × R$ 0,314 = R$ 3.140/mês
```

**Com 50% desconto = R$ 1.570/mês**

```
Seu custo: 10.000 × R$ 0,060 + R$ 50 = R$ 650
Margem: R$ 1.570 - R$ 650 = R$ 920
Margem %: 58,6% ✅
```

**PREÇO RECOMENDADO (10k avg): R$ 1.570/mês**

---

#### CENÁRIO C: Cliente Médio = 20.000 msgs/mês

**Baseline Meta:**
```
20.000 msgs × R$ 0,314 = R$ 6.280/mês
```

**Com 50% desconto = R$ 3.140/mês**

```
Seu custo: 20.000 × R$ 0,060 + R$ 50 = R$ 1.250
Margem: R$ 3.140 - R$ 1.250 = R$ 1.890
Margem %: 60,1% ✅
```

**PREÇO RECOMENDADO (20k avg): R$ 3.140/mês**

---

## 5. RECOMENDAÇÃO: Plano Mensal Flexível

### 5.1 Modelo "Pay-as-you-go Mensal" (Recomendado)

Em vez de um preço fixo, ofereça:

```
PLANO MENSAL: R$ 0,157/msg (exatamente 50% desconto)

Funcionamento:
1. Cliente usa quanto precisa
2. No final do mês, paga R$ 0,157 × total de msgs
3. Sem limite mínimo, sem limite máximo

Exemplos:
├─ 1.000 msgs: R$ 157
├─ 5.000 msgs: R$ 785
├─ 10.000 msgs: R$ 1.570
├─ 20.000 msgs: R$ 3.140
└─ 50.000 msgs: R$ 7.850
```

**Vantagens:**
- ✅ Simples de entender
- ✅ Justo para cliente (paga exatamente 50% desconto)
- ✅ Sua margem é sempre 61,8%
- ✅ Escalável sem limite
- ✅ Cliente pode começar pequeno, crescer depois

---

## 6. TABELA RESUMIDA: 3 PLANOS

| Plano | Preço | Msgs | Preço/Msg | Você Cobra | Seu Custo | Seu Lucro | Margem |
|-------|-------|------|-----------|-----------|-----------|-----------|--------|
| **1k One-time** | **R$ 157** | 1.000 | R$ 0,157 | R$ 157 | R$ 60 | **R$ 97** | 61,8% |
| **10k One-time** | **R$ 1.570** | 10.000 | R$ 0,157 | R$ 1.570 | R$ 600 | **R$ 970** | 61,8% |
| **Mensal (5k avg)** | **R$ 785** | 5.000 | R$ 0,157 | R$ 785 | R$ 350 | **R$ 435** | 55,4% |
| **Mensal (10k avg)** | **R$ 1.570** | 10.000 | R$ 0,157 | R$ 1.570 | R$ 650 | **R$ 920** | 58,6% |
| **Mensal (20k avg)** | **R$ 3.140** | 20.000 | R$ 0,157 | R$ 3.140 | R$ 1.250 | **R$ 1.890** | 60,1% |
| **Mensal (Flex)** | **R$ 0,157/msg** | Variável | R$ 0,157 | Variável | Variável | **61,8%** | 61,8% |

---

## 7. COMO APRESENTAR AO CLIENTE

### 7.1 Opção A: 3 Planos Fixos (Mais Simples)

```
┌────────────────────────────────────┐
│ 💳 1.000 MENSAGENS                 │
├────────────────────────────────────┤
│ Preço: R$ 157                      │
│ Economia vs Meta: 50% ✅           │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ 📦 10.000 MENSAGENS                │
├────────────────────────────────────┤
│ Preço: R$ 1.570                    │
│ (R$ 0,157 por msg)                 │
│ Economia vs Meta: 50% ✅           │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ 📅 MENSAL (Flexível)               │
├────────────────────────────────────┤
│ Preço: R$ 0,157/msg                │
│ (Pague pelo que usar)              │
│ Economia vs Meta: 50% ✅           │
│ Exemplos:                          │
│ ├─ 5k msgs: R$ 785                 │
│ ├─ 10k msgs: R$ 1.570              │
│ └─ 20k msgs: R$ 3.140              │
└────────────────────────────────────┘
```

### 7.2 Opção B: 3 Planos com Foco em Volume

```
🚀 STARTER
├─ 1.000 msgs: R$ 157
├─ Economia: 50% vs Meta
└─ Ideal para: Testes

💼 PROFESSIONAL
├─ 10.000 msgs: R$ 1.570
├─ Economia: 50% vs Meta
├─ Suporte: Chat 24h
└─ Ideal para: Agências, PMEs

🏢 ENTERPRISE
├─ Mensal (volume variável)
├─ R$ 0,157/msg
├─ Economia: 50% vs Meta
├─ Suporte: Dedicado
└─ Ideal para: Grandes volumes
```

---

## 8. COMPARAÇÃO: 50% DESCONTO vs PROPOSTA ANTERIOR

### 8.1 Planos Anteriores vs Novos

| Métrica | Anterior | Novo (50% desc) | Mudança |
|---------|----------|-----------------|---------|
| **1k msgs** | R$ 239 | R$ 157 | ↓ 34% |
| **10k msgs** | R$ 1.455/mês | R$ 1.570 one-time | ↓ 8% (recorrente) |
| **Mensal** | R$ 180 (Starter) | R$ 785 (5k avg) | ↑ 336% (mais uso) |
| **Mensal** | R$ 1.455 (Prof) | R$ 1.570 (10k avg) | ↑ 8% |
| **Sua margem** | 50-60% | 55-62% | ↑ |

**Análise:**
- One-time: Cliente economiza mais (34%)
- Mensal: Você cobra pelo uso real do cliente
- Sua margem: Melhor, sempre 50%+

---

## 9. RECOMENDAÇÃO FINAL

### ✅ OFEREÇA ESTES 3 PLANOS:

```
1️⃣ 1.000 MENSAGENS: R$ 157 (one-time)
   └─ 50% economia vs Meta

2️⃣ 10.000 MENSAGENS: R$ 1.570 (one-time)
   └─ 50% economia vs Meta

3️⃣ MENSAL (Flexível): R$ 0,157/msg
   ├─ Pague pelo que usar
   ├─ Sem limite mínimo
   ├─ 50% economia garantida
   └─ Ideal para: Crescimento ilimitado
```

### 💡 Matriz de Recomendação para Cliente:

```
"Quanto você precisa enviar por mês?"

├─ Uma vez (teste): → 1.000 msgs por R$ 157
├─ 5-8k msgs/mês: → Mensal (R$ 0,157/msg)
├─ 10-15k msgs/mês: → 10k msgs (R$ 1.570) ou Mensal
└─ 20k+ msgs/mês: → Mensal com desconto volume
```

---

## 10. Modelo de Receita (1.000 clientes com 50% desc)

```
40% One-time (1k msgs): 400 × R$ 157 = R$ 62.800
├─ Seu custo: R$ 24.000
└─ Seu lucro: R$ 38.800

30% One-time (10k msgs): 300 × R$ 1.570 = R$ 471.000
├─ Seu custo: R$ 180.000
└─ Seu lucro: R$ 291.000

30% Mensal (avg 10k): 300 × R$ 1.570 = R$ 471.000/mês
├─ Seu custo: R$ 195.000/mês
└─ Seu lucro: R$ 276.000/mês

TOTAL MENSAL: R$ 1.004.800 receita
LUCRO MENSAL: R$ 605.800 (60,3% margem)
```

---

## Conclusão

**3 Planos Recomendados (com 50% desconto vs Meta):**

| # | Plano | Preço | Margem | Caso de Uso |
|---|-------|-------|--------|------------|
| 1 | 1.000 msgs | **R$ 157** | 61,8% | Teste/Pontual |
| 2 | 10.000 msgs | **R$ 1.570** | 61,8% | Volume único |
| 3 | Mensal Flexível | **R$ 0,157/msg** | 61,8% | Recorrente/Crescimento |

**Vantagem:** Todos têm exatamente 50% desconto vs Meta, margem alta (60%+), e cobrem todos os casos de uso.

---

**Versão**: 1.0  
**Data**: 2026-09-09  
**Recomendação**: Ofereça os 3 planos com R$ 0,157/msg base (50% desconto)

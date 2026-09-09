# Plano de Precificação - Campanhas MKT

## Visão Geral

O Campanhas MKT é uma plataforma SaaS para gerenciamento e envio de campanhas de marketing em massa via WhatsApp e canais integrados. Este documento define a estratégia de precificação, modelo de custos e tiers de serviço.

## 1. Modelos de Precificação

### 1.1 Modelo Base: Usage-Based + Tier Fixo

Combinação de:
- **Assinatura base** (acesso à plataforma)
- **Custo por mensagem** (conforme consumo)
- **Limites e features** por tier

### 1.2 Tiers de Serviço

| Aspecto | Starter | Professional | Enterprise |
|---------|---------|--------------|------------|
| **Preço Mensal (Base)** | R$ 99 | R$ 299 | Customizado |
| **Mensagens/Mês Incluídas** | 1.000 | 10.000 | Negociado |
| **Preço por Mensagem Extra** | R$ 0,12 | R$ 0,10 | R$ 0,08 |
| **Contatos (Máximo)** | 5.000 | 50.000 | Ilimitado |
| **Campanhas Simultâneas** | 1 | 10 | Ilimitado |
| **APIs & Integrações** | 2 | 10 | Customizado |
| **Suporte** | Email (48h) | Chat (24h) | Dedicado |
| **Relatórios** | Básicos | Avançados | Custom BI |
| **Agendamento de Campanhas** | ✓ | ✓ | ✓ |
| **Segmentação de Audiência** | Básica | Avançada | Machine Learning |

## 2. Estrutura de Custos Operacionais

### 2.1 Custos Fixos Mensais

| Item | Custo Estimado |
|------|---|
| Infraestrutura (Vercel + Supabase) | R$ 1.500 - R$ 3.000 |
| APIs Externas (WhatsApp Cloud, Evolution) | R$ 500 - R$ 1.000 |
| CDN & Storage (S3/Cloudflare) | R$ 300 - R$ 500 |
| Monitoramento & Observabilidade | R$ 200 - R$ 400 |
| Email & Comunicação | R$ 100 - R$ 200 |
| **Total Fixo** | **R$ 2.600 - R$ 5.100** |

### 2.2 Custos Variáveis por Mensagem

| Item | Custo por 1.000 mensagens |
|------|---|
| WhatsApp Cloud API | R$ 12,00 - R$ 18,00 |
| Evolution API (alternativa) | R$ 8,00 - R$ 12,00 |
| Processamento (workers) | R$ 2,00 - R$ 4,00 |
| Storage & Logs | R$ 1,00 - R$ 2,00 |
| Banda de dados | R$ 0,50 - R$ 1,00 |
| **Total por 1.000 msgs** | **R$ 23,50 - R$ 37,00** |

**Custo por mensagem: R$ 0,024 - R$ 0,037**

## 3. Previsão de Receita

### 3.1 Cenários de Crescimento

#### Cenário Conservador (Mês 1-3)
- 20 clientes Starter
- 5 clientes Professional
- Volume: 100.000 mensagens/mês

**Receita Mensal:**
- Assinaturas: (20 × R$ 99) + (5 × R$ 299) = R$ 3.775
- Mensagens extras: 100.000 - 30.000 = 70.000 × R$ 0,11 (média) = R$ 7.700
- **Total: R$ 11.475**
- **Margem: R$ 11.475 - R$ 5.100 - (100.000 × R$ 0,030) = R$ 2.375 (20.7%)**

#### Cenário Moderado (Mês 4-6)
- 60 clientes Starter
- 20 clientes Professional
- 2 clientes Enterprise
- Volume: 500.000 mensagens/mês

**Receita Mensal:**
- Assinaturas: (60 × R$ 99) + (20 × R$ 299) + (2 × R$ 2.000) = R$ 10.700
- Mensagens extras: 500.000 - 230.000 = 270.000 × R$ 0,11 = R$ 29.700
- **Total: R$ 40.400**
- **Margem: R$ 40.400 - R$ 5.100 - (500.000 × R$ 0,030) = R$ 20.900 (51.8%)**

#### Cenário Otimista (Mês 7-12)
- 150 clientes Starter
- 80 clientes Professional
- 10 clientes Enterprise
- Volume: 2.000.000 mensagens/mês

**Receita Mensal:**
- Assinaturas: (150 × R$ 99) + (80 × R$ 299) + (10 × R$ 2.000) = R$ 48.830
- Mensagens extras: 2.000.000 - 1.030.000 = 970.000 × R$ 0,10 = R$ 97.000
- **Total: R$ 145.830**
- **Margem: R$ 145.830 - R$ 7.000 - (2.000.000 × R$ 0,030) = R$ 78.830 (54.1%)**

## 4. Modelo de Custos por Cliente

### 4.1 Customer Acquisition Cost (CAC)

- Marketing & Ads: R$ 500 - R$ 1.500 por cliente
- Sales & Onboarding: R$ 200 - R$ 500 por cliente
- **CAC Total: R$ 700 - R$ 2.000**

### 4.2 Customer Lifetime Value (LTV)

**Tier Starter:**
- Assinatura: R$ 99/mês
- Margem assinatura: 70%
- Duração média: 12 meses
- **LTV: R$ 99 × 12 × 0,70 = R$ 831**

**Tier Professional:**
- Assinatura: R$ 299/mês
- Msgs extras (média): 50.000/mês × R$ 0,10 × 0,70 = R$ 3.500
- Margem combinada: 65%
- Duração média: 18 meses
- **LTV: (R$ 299 + R$ 3.500) × 18 × 0,65 = R$ 43.291**

**Tier Enterprise:**
- Assinatura: R$ 2.000 - R$ 5.000/mês
- Msgs: 5M+ com preço negociado
- Margem: 60%
- Duração média: 24+ meses
- **LTV: ~R$ 500.000+**

### 4.3 Payback Period

- **Starter**: CAC R$ 1.500 ÷ (R$ 99 × 0,70 / 12) = ~26 meses
- **Professional**: CAC R$ 2.000 ÷ (R$ 3.800 × 0,65 / 12) = ~1,2 meses
- **Enterprise**: CAC R$ 5.000 ÷ (R$ 100.000 × 0,60 / 12) = ~1 mês

## 5. Otimizações de Custo

### 5.1 Redução de Infraestrutura

1. **Auto-scaling**: Reduzir custos fixos com escalabilidade automática
2. **Compressão de logs**: Arquivar dados antigos em S3 Glacier
3. **Cache otimizado**: Reduzir requisições ao banco de dados
4. **CDN regional**: Distribuir conteúdo por regiões

**Economia potencial: R$ 500 - R$ 1.000/mês**

### 5.2 Otimização de APIs

1. **Batching de mensagens**: Enviar em lotes para reduzir overhead
2. **Rate limiting inteligente**: Limitar picos de tráfego
3. **Fallback de providers**: Usar Evolution API para backup (mais barato)
4. **Negociação com WhatsApp**: Volume discounts para 1M+ mensagens/mês

**Economia potencial: R$ 1.000 - R$ 2.000/mês**

### 5.3 Otimização de Dados

1. **Compressão**: Reduzir tamanho de payloads
2. **Paginação**: Limitar dados transferidos
3. **Índices otimizados**: Melhorar performance de queries
4. **Particionamento**: Dados históricos em tabelas separadas

**Economia potencial: R$ 200 - R$ 500/mês**

## 6. Estratégia de Pricing Dinâmico (Futuro)

### 6.1 Volume Discounts
- 1M+ msgs/mês: 5% desconto
- 5M+ msgs/mês: 10% desconto
- 10M+ msgs/mês: 15% desconto

### 6.2 Discounts Anuais
- Contrato anual: 15% desconto
- Pagamento upfront: 5% desconto adicional

### 6.3 Add-ons Premium

| Serviço | Preço |
|---------|-------|
| Phone Verification | R$ 0,05 por verificação |
| SMS Gateway | R$ 0,08 por SMS |
| Webhook Customizado | R$ 299/mês |
| Data Export (semanal) | R$ 199/mês |
| Machine Learning Insights | R$ 499/mês |
| Dedicated Account Manager | R$ 1.999/mês |

## 7. Análise Competitiva

### 7.1 Competitors & Benchmarking

| Plataforma | Starter | Professional | Features |
|-----------|---------|--------------|----------|
| **Campanhas MKT** | R$ 99 | R$ 299 | WhatsApp + Integrações |
| Twilio Segment | R$ 300 | R$ 1.200 | SMS/WhatsApp enterprise |
| MessageBird | R$ 250 | R$ 800 | Multi-channel |
| Zenvia | R$ 150 | R$ 600 | Brasil-focused |

**Vantagem**: 30-50% mais barato que competitors, especializado em WhatsApp Brasil.

## 8. KPIs de Sucesso

### 8.1 Métricas Financeiras

| KPI | Meta (6 meses) |
|-----|---|
| MRR (Monthly Recurring Revenue) | R$ 40.000+ |
| Churn Rate | < 5% |
| LTV:CAC Ratio | > 3:1 |
| Gross Margin | > 50% |
| Free Trial to Paid Conversion | > 20% |

### 8.2 Métricas Operacionais

| KPI | Meta |
|-----|------|
| Uptime | > 99.9% |
| Message Delivery Rate | > 98% |
| API Response Time | < 200ms |
| Support Response Time | < 2h |
| Feature Deployment | 2x/semana |

## 9. Roadmap de Implementação

### Sprint 1-2 (Semanas 1-4)
- [ ] Publicar pricing page
- [ ] Configurar gateway de pagamento (Stripe/PagSeguro)
- [ ] Criar sistema de metering de uso
- [ ] Implementar limites por tier

### Sprint 3-4 (Semanas 5-8)
- [ ] Dashboard de usage/billing
- [ ] Sistema de invoicing automático
- [ ] Relatórios de custo por cliente
- [ ] Add-ons premium

### Sprint 5-6 (Semanas 9-12)
- [ ] Volume discounts automáticos
- [ ] Integração com contabilidade
- [ ] Análise de LTV/CAC
- [ ] Recomendações de tier upgrade

## 10. Revisão e Ajustes

- **Mensal**: Revisar MRR, churn, custo de aquisição
- **Trimestral**: Ajustar preços conforme market conditions
- **Semestralmente**: Reavaliar custos de infraestrutura e APIs
- **Anualmente**: Estratégia completa de pricing

---

## Apêndices

### A. Fórmulas de Cálculo

```
Receita Assinatura = Σ(Clientes por Tier × Preço do Tier)

Receita Mensagens = (Mensagens Totais - Incluídas) × Preço por Mensagem

Receita Total = Receita Assinatura + Receita Mensagens

Custo Variável = Mensagens Totais × Custo por Mensagem

Custo Total = Custos Fixos + Custo Variável

Margem Bruta = (Receita Total - Custo Total) / Receita Total

CAC Payback = CAC / (LTV / Meses de Duração)
```

### B. Referências

- [WhatsApp Cloud API Pricing](https://developers.facebook.com/docs/whatsapp/cloud-api/pricing)
- [Evolution API Pricing](https://docs.evolution-api.com/)
- [Vercel Pricing](https://vercel.com/pricing)
- [Supabase Pricing](https://supabase.com/pricing)

---

**Versão**: 1.0  
**Data**: 2026-09-09  
**Responsável**: Equipe de Negócios

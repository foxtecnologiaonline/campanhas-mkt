# Guia de Implementação - Sistema de Billing

## 1. Visão Geral do Sistema

O sistema de billing do Campanhas MKT é baseado em três componentes:

1. **Metering Service** - Coleta uso em tempo real
2. **Billing Engine** - Calcula encargos e gera faturas
3. **Payment Gateway** - Processa pagamentos

## 2. Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                User Application                      │
└──────────────────────┬──────────────────────────────┘
                       │ Envia eventos de uso
                       ▼
┌─────────────────────────────────────────────────────┐
│           Metering Service (Event Stream)            │
│  - Kafka/Redis para processar eventos em tempo real │
│  - Rate limiting e deduplicação                      │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
  ┌──────────────┐    ┌──────────────┐
  │ Usage Metrics│    │  Aggregation │
  │   Database   │    │   Service    │
  └──────────────┘    └──────────────┘
        │                     │
        └──────────┬──────────┘
                   ▼
    ┌──────────────────────────┐
    │   Billing Engine         │
    │ - Calcula encargos       │
    │ - Aplica descontos       │
    │ - Gera invoices          │
    └────────┬─────────────────┘
             ▼
    ┌──────────────────────────┐
    │  Payment Processing      │
    │ (Stripe/PagSeguro)       │
    └──────────────────────────┘
```

## 3. Componentes Principais

### 3.1 Metering Service

**Responsabilidades:**
- Capturar eventos de uso (mensagens enviadas, contatos criados, etc)
- Validar eventos antes de processar
- Aplicar rate limiting
- Agregar dados por período e cliente

**Implementação:**

```typescript
// src/billing/metering/metering.service.ts
import { EventEmitter } from 'events';

export enum UsageEventType {
  MESSAGE_SENT = 'message.sent',
  CONTACT_CREATED = 'contact.created',
  CAMPAIGN_CREATED = 'campaign.created',
  API_CALL = 'api.call',
  STORAGE_USED = 'storage.used',
}

export interface UsageEvent {
  id: string;
  customerId: string;
  eventType: UsageEventType;
  metadata: Record<string, unknown>;
  timestamp: Date;
  value: number; // quantidade (ex: 1 para 1 mensagem)
}

export class MeteringService {
  private eventQueue: UsageEvent[] = [];

  async recordEvent(event: UsageEvent): Promise<void> {
    // Validar evento
    this.validateEvent(event);

    // Guardar em queue
    this.eventQueue.push(event);

    // Registrar em banco se fila está grande
    if (this.eventQueue.length >= 1000) {
      await this.flushEvents();
    }
  }

  async flushEvents(): Promise<void> {
    // Batch insert em banco de dados
    const events = this.eventQueue.splice(0);
    await this.database.usageEvents.insertMany(events);
  }

  private validateEvent(event: UsageEvent): void {
    if (!event.customerId || !event.eventType) {
      throw new Error('Invalid event');
    }
  }
}
```

### 3.2 Usage Aggregation

**Responsabilidades:**
- Consolidar eventos diários/mensais
- Calcular totais por tipo de uso
- Atualizar cache de usage

**Dados a agregar:**
- Mensagens enviadas
- Contatos criados
- Campanhas executadas
- Chamadas à API
- Armazenamento usado

```typescript
// src/billing/aggregation/usage-aggregator.service.ts
export interface AggregatedUsage {
  customerId: string;
  period: 'daily' | 'monthly';
  date: Date;
  metrics: {
    messagesSent: number;
    contactsCreated: number;
    campaignsExecuted: number;
    apiCalls: number;
    storageUsedGb: number;
  };
}

export class UsageAggregatorService {
  async aggregateForCustomer(
    customerId: string,
    month: Date
  ): Promise<AggregatedUsage> {
    const events = await this.database.usageEvents.find({
      customerId,
      timestamp: {
        $gte: new Date(month.getFullYear(), month.getMonth(), 1),
        $lt: new Date(month.getFullYear(), month.getMonth() + 1, 1),
      },
    });

    return {
      customerId,
      period: 'monthly',
      date: month,
      metrics: {
        messagesSent: events
          .filter((e) => e.eventType === UsageEventType.MESSAGE_SENT)
          .reduce((sum, e) => sum + e.value, 0),
        contactsCreated: events
          .filter((e) => e.eventType === UsageEventType.CONTACT_CREATED)
          .reduce((sum, e) => sum + e.value, 0),
        campaignsExecuted: events
          .filter((e) => e.eventType === UsageEventType.CAMPAIGN_CREATED)
          .reduce((sum, e) => sum + e.value, 0),
        apiCalls: events
          .filter((e) => e.eventType === UsageEventType.API_CALL)
          .reduce((sum, e) => sum + e.value, 0),
        storageUsedGb: events
          .filter((e) => e.eventType === UsageEventType.STORAGE_USED)
          .reduce((sum, e) => sum + e.value, 0),
      },
    };
  }
}
```

### 3.3 Billing Engine

**Responsabilidades:**
- Calcular encargos baseado em tier e uso
- Aplicar descontos
- Gerar invoices
- Registrar para payment processing

```typescript
// src/billing/engine/billing.service.ts
export interface Invoice {
  id: string;
  customerId: string;
  billingPeriod: { start: Date; end: Date };
  items: InvoiceLineItem[];
  subtotal: number; // centavos
  discount: number;
  tax: number;
  total: number;
  status: 'draft' | 'issued' | 'paid' | 'failed';
  dueDate: Date;
  paymentMethod?: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number; // centavos
  amount: number; // centavos
}

export class BillingService {
  async generateInvoice(customerId: string, month: Date): Promise<Invoice> {
    // 1. Buscar dados do cliente
    const customer = await this.database.customers.findOne({ id: customerId });
    const tier = PRICING_TIERS[customer.tier];

    // 2. Agregar uso
    const usage = await this.usageAggregator.aggregateForCustomer(
      customerId,
      month
    );

    // 3. Calcular encargos
    const items: InvoiceLineItem[] = [];

    // Assinatura base
    items.push({
      description: `${tier.name} Subscription`,
      quantity: 1,
      unitPrice: tier.monthlyPrice,
      amount: tier.monthlyPrice,
    });

    // Mensagens extras
    const extraMessages = Math.max(
      0,
      usage.metrics.messagesSent - tier.features.includesMessagesPerMonth
    );
    if (extraMessages > 0) {
      const pricePerMessage = calculatePriceWithVolumeDiscount(
        tier.features.pricePerExtraMessage,
        usage.metrics.messagesSent
      );
      items.push({
        description: `${extraMessages} extra messages at R$ ${(pricePerMessage / 100).toFixed(4)}`,
        quantity: extraMessages,
        unitPrice: pricePerMessage,
        amount: extraMessages * pricePerMessage,
      });
    }

    // Add-ons
    const addons = await this.database.subscriptions.findAddons(customerId);
    for (const addon of addons) {
      if (addon.monthlyPrice > 0) {
        items.push({
          description: addon.name,
          quantity: 1,
          unitPrice: addon.monthlyPrice,
          amount: addon.monthlyPrice,
        });
      }
    }

    // 4. Calcular subtotal
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);

    // 5. Aplicar descontos
    let discount = 0;
    if (customer.billingFrequency === 'annual') {
      discount = Math.floor(subtotal * (ANNUAL_DISCOUNT / 100));
    }
    if (customer.paidUpfront) {
      discount += Math.floor(subtotal * (UPFRONT_PAYMENT_DISCOUNT / 100));
    }

    // 6. Calcular impostos (ICMS aproximado)
    const taxableAmount = subtotal - discount;
    const tax = Math.floor(taxableAmount * 0.15); // 15% ICMS

    // 7. Criar invoice
    const invoice: Invoice = {
      id: `INV-${customerId}-${month.getTime()}`,
      customerId,
      billingPeriod: {
        start: new Date(month.getFullYear(), month.getMonth(), 1),
        end: new Date(month.getFullYear(), month.getMonth() + 1, 0),
      },
      items,
      subtotal,
      discount,
      tax,
      total: subtotal - discount + tax,
      status: 'draft',
      dueDate: new Date(month.getFullYear(), month.getMonth() + 1, 15),
    };

    return invoice;
  }

  async issueInvoice(invoice: Invoice): Promise<void> {
    invoice.status = 'issued';
    await this.database.invoices.update(invoice);

    // Enviar email com invoice
    await this.emailService.sendInvoice(invoice);

    // Registrar para payment processing
    await this.paymentQueue.enqueue({
      invoiceId: invoice.id,
      customerId: invoice.customerId,
      amount: invoice.total,
      dueDate: invoice.dueDate,
    });
  }
}
```

### 3.4 Payment Processing

**Integrações:**

```typescript
// src/billing/payment/payment.service.ts
export enum PaymentProvider {
  STRIPE = 'stripe',
  PAGSEGURO = 'pagseguro',
}

export interface PaymentRequest {
  invoiceId: string;
  customerId: string;
  amount: number; // centavos
  currency: string;
  paymentMethod: PaymentProvider;
  metadata: Record<string, unknown>;
}

export class PaymentService {
  async processPayment(request: PaymentRequest): Promise<void> {
    try {
      const result = await this.getProvider(request.paymentMethod).charge(
        request
      );

      // Atualizar invoice
      await this.database.invoices.update({
        id: request.invoiceId,
        status: 'paid',
        paymentId: result.id,
        paidAt: new Date(),
      });

      // Registrar em auditoria
      await this.auditLog.log({
        action: 'PAYMENT_PROCESSED',
        customerId: request.customerId,
        invoiceId: request.invoiceId,
        amount: request.amount,
        result: result.status,
      });
    } catch (error) {
      // Atualizar invoice como falha
      await this.database.invoices.update({
        id: request.invoiceId,
        status: 'failed',
        errorMessage: error.message,
      });

      // Retentar em 24h
      await this.paymentRetryQueue.enqueue({
        invoiceId: request.invoiceId,
        retryAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
    }
  }

  private getProvider(provider: PaymentProvider): PaymentGateway {
    switch (provider) {
      case PaymentProvider.STRIPE:
        return this.stripeProvider;
      case PaymentProvider.PAGSEGURO:
        return this.pagSeguroProvider;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }
}
```

## 4. Database Schema

### 4.1 Tabelas Necessárias

```sql
-- Eventos de uso
CREATE TABLE usage_events (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  value NUMERIC NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE INDEX idx_usage_events_customer_date 
  ON usage_events(customer_id, created_at);

-- Uso agregado
CREATE TABLE aggregated_usage (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL,
  period DATE NOT NULL,
  messages_sent BIGINT DEFAULT 0,
  contacts_created BIGINT DEFAULT 0,
  campaigns_executed BIGINT DEFAULT 0,
  api_calls BIGINT DEFAULT 0,
  storage_used_gb NUMERIC DEFAULT 0,
  created_at TIMESTAMP NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  UNIQUE(customer_id, period)
);

-- Invoices
CREATE TABLE invoices (
  id VARCHAR(255) PRIMARY KEY,
  customer_id UUID NOT NULL,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  subtotal BIGINT NOT NULL,
  discount BIGINT DEFAULT 0,
  tax BIGINT DEFAULT 0,
  total BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL, -- draft, issued, paid, failed
  due_date DATE NOT NULL,
  paid_at TIMESTAMP,
  payment_id VARCHAR(255),
  error_message TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE INDEX idx_invoices_customer_status 
  ON invoices(customer_id, status);

-- Invoice Line Items
CREATE TABLE invoice_line_items (
  id UUID PRIMARY KEY,
  invoice_id VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit_price BIGINT NOT NULL,
  amount BIGINT NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- Pagamentos
CREATE TABLE payments (
  id VARCHAR(255) PRIMARY KEY,
  invoice_id VARCHAR(255) NOT NULL,
  customer_id UUID NOT NULL,
  amount BIGINT NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  status VARCHAR(20) NOT NULL, -- pending, succeeded, failed
  provider VARCHAR(20) NOT NULL, -- stripe, pagseguro
  provider_id VARCHAR(255),
  error_message TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE INDEX idx_payments_invoice_status 
  ON payments(invoice_id, status);
```

## 5. Fluxo de Billing Mensal

```
Dia 1-28:   Coletar eventos de uso via Metering Service
            ↓
Dia 28:     Agregar uso do mês via UsageAggregator
            ↓
Dia 29:     Gerar invoices via BillingEngine
            ↓
Dia 30:     Emitir invoices e enviar por email
            ↓
Dia 31:     Processar pagamentos
            ↓
Dia 1:      Retentar pagamentos falhados
```

## 6. APIs Públicas

### 6.1 Usage API

```
GET /api/billing/usage?month=2026-09
Returns: {
  period: "2026-09",
  tier: "professional",
  metrics: {
    messagesSent: 45000,
    contactsCreated: 1200,
    storageUsedGb: 2.5
  },
  includedMessages: 10000,
  extraMessages: 35000,
  estimatedCharge: 3500 // centavos
}
```

### 6.2 Invoices API

```
GET /api/billing/invoices
Returns: [{
  id: "INV-...",
  period: { start, end },
  total: 4500,
  status: "paid",
  items: [...]
}]

GET /api/billing/invoices/{id}/pdf
Returns: PDF binary
```

### 6.3 Subscriptions API

```
GET /api/billing/subscription
Returns: {
  tier: "professional",
  monthlyPrice: 29900,
  billingCycle: "monthly",
  status: "active"
}

PUT /api/billing/subscription/tier
Body: { tier: "enterprise" }
```

## 7. Alertas e Notificações

- Email de aviso quando uso aproximar-se do limite
- Dashboard de usage em tempo real
- Webhooks para eventos de pagamento
- Notificações de pagamento falhado

## 8. Segurança

- PCI DSS compliance para dados de cartão
- Tokens de pagamento em lugar de dados brutos
- Auditoria completa de todas transações
- Rate limiting em APIs de billing
- Criptografia de dados sensíveis

## 9. Testes

```typescript
// test/billing.service.spec.ts
describe('BillingService', () => {
  it('should calculate invoice correctly', async () => {
    const invoice = await billingService.generateInvoice(
      customerId,
      new Date(2026, 8) // setembro
    );

    expect(invoice.items).toHaveLength(2); // subscription + extras
    expect(invoice.total).toBeGreaterThan(invoice.subtotal - invoice.discount);
  });

  it('should apply volume discount', async () => {
    // Mock 5M messages
    const invoice1 = await generateInvoice(5000000);
    const invoice2 = await generateInvoice(4999999);

    // Volume discount deve aplicar em invoice1
    expect(invoice1.discount).toBeGreaterThan(invoice2.discount);
  });
});
```

---

**Versão**: 1.0  
**Data**: 2026-09-09  
**Status**: Draft

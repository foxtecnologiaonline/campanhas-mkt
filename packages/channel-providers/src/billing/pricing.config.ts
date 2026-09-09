/**
 * Configuração de precificação e tiers para Campanhas MKT
 * Define os planos, custos e limites de uso
 */

export enum PricingTier {
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

export interface PricingConfig {
  id: PricingTier;
  name: string;
  description: string;
  monthlyPrice: number; // em centavos (R$)
  features: PricingFeatures;
  limits: PricingLimits;
  support: SupportLevel;
}

export interface PricingFeatures {
  includesMessagesPerMonth: number;
  pricePerExtraMessage: number; // em centavos (R$)
  maxContacts: number;
  simultaneousCampaigns: number;
  apiIntegrations: number;
  advancedSegmentation: boolean;
  customReports: boolean;
  webhooks: boolean;
  schedulingEnabled: boolean;
  mlInsights: boolean;
}

export interface PricingLimits {
  maxMessagesPerDay: number;
  maxContactsPerCampaign: number;
  maxApiCallsPerMinute: number;
  dataRetentionDays: number;
  storageGbPerMonth: number;
}

export interface SupportLevel {
  tier: 'email' | 'chat' | 'dedicated';
  responseTimeMinutes: number;
  includesDedicatedManager: boolean;
}

export const PRICING_TIERS: Record<PricingTier, PricingConfig> = {
  [PricingTier.STARTER]: {
    id: PricingTier.STARTER,
    name: 'Starter',
    description: 'Perfeito para empresas iniciando com campanhas em massa',
    monthlyPrice: 9900, // R$ 99
    features: {
      includesMessagesPerMonth: 1000,
      pricePerExtraMessage: 12, // R$ 0,12
      maxContacts: 5000,
      simultaneousCampaigns: 1,
      apiIntegrations: 2,
      advancedSegmentation: false,
      customReports: false,
      webhooks: true,
      schedulingEnabled: true,
      mlInsights: false,
    },
    limits: {
      maxMessagesPerDay: 500,
      maxContactsPerCampaign: 5000,
      maxApiCallsPerMinute: 60,
      dataRetentionDays: 30,
      storageGbPerMonth: 10,
    },
    support: {
      tier: 'email',
      responseTimeMinutes: 1440, // 24 horas
      includesDedicatedManager: false,
    },
  },

  [PricingTier.PROFESSIONAL]: {
    id: PricingTier.PROFESSIONAL,
    name: 'Professional',
    description: 'Para agências e empresas em crescimento',
    monthlyPrice: 29900, // R$ 299
    features: {
      includesMessagesPerMonth: 10000,
      pricePerExtraMessage: 10, // R$ 0,10
      maxContacts: 50000,
      simultaneousCampaigns: 10,
      apiIntegrations: 10,
      advancedSegmentation: true,
      customReports: true,
      webhooks: true,
      schedulingEnabled: true,
      mlInsights: false,
    },
    limits: {
      maxMessagesPerDay: 50000,
      maxContactsPerCampaign: 50000,
      maxApiCallsPerMinute: 300,
      dataRetentionDays: 90,
      storageGbPerMonth: 100,
    },
    support: {
      tier: 'chat',
      responseTimeMinutes: 240, // 4 horas
      includesDedicatedManager: false,
    },
  },

  [PricingTier.ENTERPRISE]: {
    id: PricingTier.ENTERPRISE,
    name: 'Enterprise',
    description: 'Solução customizada para grandes volumes',
    monthlyPrice: 0, // Negociado
    features: {
      includesMessagesPerMonth: 0, // Negociado
      pricePerExtraMessage: 8, // R$ 0,08 (base negociável)
      maxContacts: Number.MAX_SAFE_INTEGER,
      simultaneousCampaigns: Number.MAX_SAFE_INTEGER,
      apiIntegrations: Number.MAX_SAFE_INTEGER,
      advancedSegmentation: true,
      customReports: true,
      webhooks: true,
      schedulingEnabled: true,
      mlInsights: true,
    },
    limits: {
      maxMessagesPerDay: Number.MAX_SAFE_INTEGER,
      maxContactsPerCampaign: Number.MAX_SAFE_INTEGER,
      maxApiCallsPerMinute: 10000,
      dataRetentionDays: 365,
      storageGbPerMonth: 10000,
    },
    support: {
      tier: 'dedicated',
      responseTimeMinutes: 60, // 1 hora
      includesDedicatedManager: true,
    },
  },
};

/**
 * Add-ons premium disponíveis
 */
export interface PremiumAddOn {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number; // em centavos
  availableTiers: PricingTier[];
}

export const PREMIUM_ADDONS: PremiumAddOn[] = [
  {
    id: 'phone-verification',
    name: 'Phone Verification',
    description: 'Verificação de número de telefone',
    monthlyPrice: 0, // Por verificação: R$ 0,05
    availableTiers: [PricingTier.PROFESSIONAL, PricingTier.ENTERPRISE],
  },
  {
    id: 'sms-gateway',
    name: 'SMS Gateway',
    description: 'Envio de SMS como complemento',
    monthlyPrice: 0, // Por SMS: R$ 0,08
    availableTiers: [PricingTier.PROFESSIONAL, PricingTier.ENTERPRISE],
  },
  {
    id: 'webhook-custom',
    name: 'Webhook Customizado',
    description: 'Endpoints customizados para eventos',
    monthlyPrice: 29900, // R$ 299
    availableTiers: [PricingTier.PROFESSIONAL, PricingTier.ENTERPRISE],
  },
  {
    id: 'data-export-weekly',
    name: 'Data Export Semanal',
    description: 'Exportação automática de dados',
    monthlyPrice: 19900, // R$ 199
    availableTiers: [PricingTier.PROFESSIONAL, PricingTier.ENTERPRISE],
  },
  {
    id: 'ml-insights',
    name: 'Machine Learning Insights',
    description: 'Análise com ML para otimização',
    monthlyPrice: 49900, // R$ 499
    availableTiers: [PricingTier.PROFESSIONAL, PricingTier.ENTERPRISE],
  },
  {
    id: 'account-manager',
    name: 'Dedicated Account Manager',
    description: 'Gestor de conta dedicado',
    monthlyPrice: 199900, // R$ 1.999
    availableTiers: [PricingTier.ENTERPRISE],
  },
];

/**
 * Descontos por volume de mensagens
 */
export interface VolumeDiscount {
  minMessages: number;
  maxMessages: number | null;
  discountPercentage: number;
}

export const VOLUME_DISCOUNTS: VolumeDiscount[] = [
  {
    minMessages: 0,
    maxMessages: 999999,
    discountPercentage: 0,
  },
  {
    minMessages: 1000000,
    maxMessages: 4999999,
    discountPercentage: 5,
  },
  {
    minMessages: 5000000,
    maxMessages: 9999999,
    discountPercentage: 10,
  },
  {
    minMessages: 10000000,
    maxMessages: null,
    discountPercentage: 15,
  },
];

/**
 * Descontos por contrato anual
 */
export const ANNUAL_DISCOUNT = 15; // 15% de desconto

/**
 * Upfront payment discount
 */
export const UPFRONT_PAYMENT_DISCOUNT = 5; // 5% adicional

/**
 * Custo base de operação por 1.000 mensagens
 */
export const OPERATIONAL_COST_PER_1K_MESSAGES = {
  whatsappApi: 5328, // R$ 53,28
  infrastructureOverhead: 250, // R$ 2,50
  storageAndLogs: 150, // R$ 1,50
  paymentProcessing: 30, // R$ 0,30 (média 2.99%)
};

export const TOTAL_COST_PER_MESSAGE =
  (Object.values(OPERATIONAL_COST_PER_1K_MESSAGES).reduce((a, b) => a + b) / 1000 / 100); // R$ por mensagem

/**
 * Calcular preço com desconto de volume
 */
export function calculatePriceWithVolumeDiscount(
  pricePerMessage: number,
  totalMessages: number
): number {
  const discount = VOLUME_DISCOUNTS.find(
    (d) =>
      totalMessages >= d.minMessages &&
      (d.maxMessages === null || totalMessages <= d.maxMessages)
  );

  if (!discount) return pricePerMessage;

  const discountAmount = (pricePerMessage * discount.discountPercentage) / 100;
  return pricePerMessage - discountAmount;
}

/**
 * Calcular receita mensal estimada
 */
export interface MonthlyRevenueEstimate {
  tier: PricingTier;
  customers: number;
  subscriptionRevenue: number;
  messageRevenue: number;
  totalRevenue: number;
  operationalCost: number;
  grossProfit: number;
  profitMargin: number; // percentual
}

export function estimateMonthlyRevenue(
  tiers: { tier: PricingTier; customers: number; avgMessagesPerMonth: number }[]
): MonthlyRevenueEstimate[] {
  return tiers.map(({ tier, customers, avgMessagesPerMonth }) => {
    const config = PRICING_TIERS[tier];

    // Receita de assinatura
    const subscriptionRevenue = (config.monthlyPrice * customers) / 100; // em R$

    // Receita de mensagens extras
    const totalMessages = avgMessagesPerMonth * customers;
    const includedMessages = config.features.includesMessagesPerMonth * customers;
    const extraMessages = Math.max(0, totalMessages - includedMessages);
    const messageRevenue = (extraMessages * config.features.pricePerExtraMessage) / 100; // em R$

    // Custo operacional
    const operationalCost = (totalMessages * TOTAL_COST_PER_MESSAGE) / 1000; // em R$

    const totalRevenue = subscriptionRevenue + messageRevenue;
    const grossProfit = totalRevenue - operationalCost;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return {
      tier,
      customers,
      subscriptionRevenue,
      messageRevenue,
      totalRevenue,
      operationalCost,
      grossProfit,
      profitMargin,
    };
  });
}

/**
 * Calcular LTV (Lifetime Value) por tier
 */
export interface CustomerLTV {
  tier: PricingTier;
  monthlyRecurringRevenue: number;
  expectedDurationMonths: number;
  lifetimeValue: number;
  paybackPeriodMonths: number;
}

export function calculateLTV(
  cacPerCustomer: number = 1500 // R$ (customer acquisition cost)
): Record<PricingTier, CustomerLTV> {
  return {
    [PricingTier.STARTER]: {
      tier: PricingTier.STARTER,
      monthlyRecurringRevenue: 99,
      expectedDurationMonths: 12,
      lifetimeValue: 99 * 12 * 0.7, // 70% margem
      paybackPeriodMonths: cacPerCustomer / ((99 * 12 * 0.7) / 12),
    },
    [PricingTier.PROFESSIONAL]: {
      tier: PricingTier.PROFESSIONAL,
      monthlyRecurringRevenue: 299 + 3500, // subscription + avg extra messages
      expectedDurationMonths: 18,
      lifetimeValue: (299 + 3500) * 18 * 0.65, // 65% margem
      paybackPeriodMonths: cacPerCustomer / (((299 + 3500) * 0.65) / 12),
    },
    [PricingTier.ENTERPRISE]: {
      tier: PricingTier.ENTERPRISE,
      monthlyRecurringRevenue: 50000, // custom
      expectedDurationMonths: 24,
      lifetimeValue: 50000 * 24 * 0.6, // 60% margem
      paybackPeriodMonths: cacPerCustomer / ((50000 * 0.6) / 12),
    },
  };
}

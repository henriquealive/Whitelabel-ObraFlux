export enum SubscriptionPlan {
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

export enum SubscriptionStatus {
  TRIALING = 'TRIALING',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  INCOMPLETE = 'INCOMPLETE',
}

export enum BillingInterval {
  MONTHLY = 'MONTHLY',
  ANNUAL = 'ANNUAL',
}

export const ANNUAL_DISCOUNT_PCT = 20; // 20% off when paying annually

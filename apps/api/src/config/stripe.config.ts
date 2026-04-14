import { registerAs } from '@nestjs/config';

export const stripeConfig = registerAs('stripe', () => ({
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  prices: {
    basicMonthly: process.env.STRIPE_PRICE_BASIC_MONTHLY || '',
    basicAnnual: process.env.STRIPE_PRICE_BASIC_ANNUAL || '',
    proMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
    proAnnual: process.env.STRIPE_PRICE_PRO_ANNUAL || '',
    enterpriseMonthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '',
    enterpriseAnnual: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL || '',
  },
}));

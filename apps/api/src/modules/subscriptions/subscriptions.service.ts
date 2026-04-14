import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import Stripe from 'stripe';
import { SubscriptionPlan, BillingInterval } from '@prisma/client';
import { PLAN_LIMITS } from '@obraflux/shared';

@Injectable()
export class SubscriptionsService {
  private readonly stripe: Stripe;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.stripe = new Stripe(configService.get<string>('stripe.secretKey', ''), {
      apiVersion: '2024-09-30.acacia',
    });
  }

  async getSubscription(tenantId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: { invoices: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    if (!sub) throw new NotFoundException('Subscription not found');
    return sub;
  }

  async createCheckoutSession(tenantId: string, plan: SubscriptionPlan, interval: BillingInterval, successUrl: string, cancelUrl: string) {
    let sub = await this.prisma.subscription.findUnique({ where: { tenantId } });

    // Ensure Stripe customer exists
    if (!sub?.stripeCustomerId) {
      const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
      const customer = await this.stripe.customers.create({ name: tenant?.name, metadata: { tenantId } });
      sub = await this.prisma.subscription.upsert({
        where: { tenantId },
        update: { stripeCustomerId: customer.id },
        create: { tenantId, stripeCustomerId: customer.id },
      });
    }

    const priceId = this.getPriceId(plan, interval);
    const session = await this.stripe.checkout.sessions.create({
      customer: sub.stripeCustomerId!,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        trial_period_days: 7,
        metadata: { tenantId, plan, interval },
      },
    });

    return { url: session.url };
  }

  async createPortalSession(tenantId: string, returnUrl: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { tenantId } });
    if (!sub?.stripeCustomerId) throw new NotFoundException('No Stripe customer found');
    const session = await this.stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: returnUrl,
    });
    return { url: session.url };
  }

  async syncFromStripe(stripeSubscription: Stripe.Subscription) {
    const tenantId = stripeSubscription.metadata?.tenantId;
    if (!tenantId) return;

    const plan = (stripeSubscription.metadata?.plan as SubscriptionPlan) || SubscriptionPlan.BASIC;
    const limits = PLAN_LIMITS[plan];

    await this.prisma.subscription.update({
      where: { tenantId },
      data: {
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: stripeSubscription.items.data[0]?.price.id,
        stripeProductId: stripeSubscription.items.data[0]?.price.product as string,
        plan,
        status: stripeSubscription.status.toUpperCase() as 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE',
        trialEndsAt: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        maxUsers: limits.maxUsers,
        maxProjects: limits.maxProjects,
        storageGb: limits.storageGb,
      },
    });
  }

  private getPriceId(plan: SubscriptionPlan, interval: BillingInterval): string {
    const prices = this.configService.get<Record<string, string>>('stripe.prices', {});
    const key = `${plan.toLowerCase()}${interval === BillingInterval.MONTHLY ? 'Monthly' : 'Annual'}`;
    return prices[key] || '';
  }
}

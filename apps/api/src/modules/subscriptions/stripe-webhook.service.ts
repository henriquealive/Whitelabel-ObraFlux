import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StripeWebhookService {
  private _stripe: Stripe | null = null;
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly prisma: PrismaService,
  ) {}

  private get stripe(): Stripe {
    if (!this._stripe) {
      const secretKey = this.configService.get<string>('stripe.secretKey', '');
      if (!secretKey) throw new Error('STRIPE_SECRET_KEY is not configured');
      this._stripe = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' });
    }
    return this._stripe;
  }

  constructEvent(rawBody: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.configService.get<string>('stripe.webhookSecret', '');
    return this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  }

  async handleEvent(event: Stripe.Event) {
    this.logger.log(`Stripe event: ${event.type}`);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.subscriptionsService.syncFromStripe(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const tenantId = sub.metadata?.tenantId;
        if (tenantId) {
          await this.prisma.subscription.update({
            where: { tenantId },
            data: { status: 'CANCELED', canceledAt: new Date() },
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const tenantId = (invoice.subscription as Stripe.Subscription)?.metadata?.tenantId
          || (await this.getInvoiceTenantId(invoice));
        if (tenantId && invoice.id) {
          await this.prisma.invoice.upsert({
            where: { stripeInvoiceId: invoice.id },
            update: { status: 'paid', amountPaid: invoice.amount_paid / 100 },
            create: {
              stripeInvoiceId: invoice.id,
              subscriptionId: (await this.prisma.subscription.findUnique({ where: { tenantId } }))?.id || '',
              amountDue: invoice.amount_due / 100,
              amountPaid: invoice.amount_paid / 100,
              status: 'paid',
              pdfUrl: invoice.invoice_pdf,
              periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
              periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
            },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const tenantId = await this.getInvoiceTenantId(invoice);
        if (tenantId) {
          await this.prisma.subscription.update({
            where: { tenantId },
            data: { status: 'PAST_DUE' },
          });
          this.logger.warn(`Payment failed for tenant ${tenantId}`);
        }
        break;
      }

      default:
        this.logger.debug(`Unhandled event type: ${event.type}`);
    }
  }

  private async getInvoiceTenantId(invoice: Stripe.Invoice): Promise<string | null> {
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
    if (!customerId) return null;
    const sub = await this.prisma.subscription.findFirst({ where: { stripeCustomerId: customerId } });
    return sub?.tenantId || null;
  }
}

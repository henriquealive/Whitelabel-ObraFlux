import { Controller, Get, Post, Body, Req, Headers, HttpCode, HttpStatus, RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { StripeWebhookService } from './stripe-webhook.service';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { BillingInterval, SubscriptionPlan } from '@prisma/client';
import { Request } from 'express';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly stripeWebhookService: StripeWebhookService,
  ) {}

  @Get()
  @ApiBearerAuth()
  getSubscription(@TenantId() tenantId: string) {
    return this.subscriptionsService.getSubscription(tenantId);
  }

  @Post('checkout')
  @ApiBearerAuth()
  createCheckout(
    @TenantId() tenantId: string,
    @Body() body: { plan: SubscriptionPlan; interval: BillingInterval; successUrl: string; cancelUrl: string },
  ) {
    return this.subscriptionsService.createCheckoutSession(tenantId, body.plan, body.interval, body.successUrl, body.cancelUrl);
  }

  @Post('portal')
  @ApiBearerAuth()
  createPortal(@TenantId() tenantId: string, @Body() body: { returnUrl: string }) {
    return this.subscriptionsService.createPortalSession(tenantId, body.returnUrl);
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    const event = this.stripeWebhookService.constructEvent(req.rawBody!, sig);
    await this.stripeWebhookService.handleEvent(event);
    return { received: true };
  }
}

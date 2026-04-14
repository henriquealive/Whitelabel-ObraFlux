import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { StripeWebhookService } from './stripe-webhook.service';

@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, StripeWebhookService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}

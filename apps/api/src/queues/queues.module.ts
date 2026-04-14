import { Module } from '@nestjs/common';

/**
 * Queues module — BullMQ workers for async processing.
 * In production, register Bull queues via BullModule.registerQueue()
 * and add processor classes for: media, email, pdf, audit.
 */
@Module({
  imports: [],
  providers: [],
  exports: [],
})
export class QueuesModule {}

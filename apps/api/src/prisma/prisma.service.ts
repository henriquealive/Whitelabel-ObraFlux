import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  async onModuleInit() {
    // Prisma connects lazily on first query — no eager $connect() needed.
    // Calling $connect() here blocks the entire NestJS bootstrap and crashes
    // the process if the DB is temporarily unreachable.
    this.logger.log('PrismaService initialised');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  /** Soft-delete helper: set deletedAt = now */
  softDelete<T extends { deletedAt?: Date | null }>(id: string) {
    return { where: { id }, data: { deletedAt: new Date() } as Partial<T> };
  }
}

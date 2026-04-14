import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationChannel } from '@prisma/client';
import { getPaginationParams, buildPaginationMeta } from '@obraflux/database';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { userId: string; tenantId: string; type: string; title: string; body: string; channel?: NotificationChannel; payload?: Record<string, unknown> }) {
    return this.prisma.notification.create({
      data: { userId: data.userId, tenantId: data.tenantId, type: data.type, title: data.title, body: data.body, channel: data.channel ?? NotificationChannel.IN_APP, data: data.payload },
    });
  }

  async findAll(userId: string, tenantId: string, opts: { page?: number; limit?: number; unreadOnly?: boolean } = {}) {
    const { skip, take, page, limit } = getPaginationParams({ page: opts.page, limit: opts.limit });
    const where = { userId, tenantId, ...(opts.unreadOnly && { isRead: false }) };
    const [items, total, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, tenantId, isRead: false } }),
    ]);
    return { data: items, meta: buildPaginationMeta(total, page, limit), unreadCount };
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true, readAt: new Date() } });
  }

  async markAllRead(userId: string, tenantId: string) {
    return this.prisma.notification.updateMany({ where: { userId, tenantId, isRead: false }, data: { isRead: true, readAt: new Date() } });
  }
}

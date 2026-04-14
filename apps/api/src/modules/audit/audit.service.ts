import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '@prisma/client';
import { getPaginationParams, buildPaginationMeta } from '@obraflux/database';

interface LogData {
  tenantId: string;
  userId?: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  requestId?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: LogData) {
    return this.prisma.auditLog.create({ data });
  }

  async findAll(tenantId: string, opts: {
    page?: number; limit?: number; userId?: string; entity?: string; action?: AuditAction;
    startDate?: Date; endDate?: Date;
  } = {}) {
    const { skip, take, page, limit } = getPaginationParams({ page: opts.page, limit: opts.limit });
    const where = {
      tenantId,
      ...(opts.userId && { userId: opts.userId }),
      ...(opts.entity && { entity: opts.entity }),
      ...(opts.action && { action: opts.action }),
      ...(opts.startDate || opts.endDate ? { createdAt: { gte: opts.startDate, lte: opts.endDate } } : {}),
    };
    const [logs, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where, skip, take, orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { data: logs, meta: buildPaginationMeta(total, page, limit) };
  }

  async exportUserData(userId: string, tenantId: string) {
    const [user, logs, projects, files] = await this.prisma.$transaction([
      this.prisma.user.findFirst({ where: { id: userId, tenantId } }),
      this.prisma.auditLog.findMany({ where: { userId, tenantId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.projectMember.findMany({ where: { userId }, include: { project: { select: { id: true, name: true } } } }),
      this.prisma.file.findMany({ where: { uploadedById: userId, tenantId } }),
    ]);
    return { user, auditLogs: logs, projects, files };
  }

  async deleteUserData(userId: string, tenantId: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { deletedAt: new Date(), email: `deleted-${userId}@deleted.invalid`, name: '[Deleted User]' } });
    await this.log({ tenantId, action: AuditAction.DELETE, entity: 'User', entityId: userId });
  }
}

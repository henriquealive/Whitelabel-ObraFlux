import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MaintenanceStatus } from '@prisma/client';
import { getPaginationParams, buildPaginationMeta } from '@obraflux/database';

@Injectable()
export class MaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(projectId: string, tenantId: string, opts: {
    page?: number; limit?: number; status?: MaintenanceStatus;
  } = {}) {
    const { skip, take, page, limit } = getPaginationParams({ page: opts.page, limit: opts.limit });
    const where = { projectId, tenantId, ...(opts.status && { status: opts.status }) };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.maintenanceLog.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { reportedBy: { select: { id: true, name: true, avatarUrl: true } } } }),
      this.prisma.maintenanceLog.count({ where }),
    ]);
    return { data: items, meta: buildPaginationMeta(total, page, limit) };
  }

  async create(data: {
    tenantId: string; projectId: string; reportedById: string;
    title: string; description: string; priority?: number; category?: string; dueDate?: Date;
  }) {
    return this.prisma.maintenanceLog.create({ data });
  }

  async updateStatus(id: string, tenantId: string, status: MaintenanceStatus, notes?: string) {
    const log = await this.prisma.maintenanceLog.findFirst({ where: { id, tenantId } });
    if (!log) throw new NotFoundException('Maintenance log not found');
    return this.prisma.maintenanceLog.update({
      where: { id },
      data: { status, notes, resolvedAt: status === MaintenanceStatus.RESOLVED ? new Date() : undefined },
    });
  }

  async delete(id: string, tenantId: string) {
    const log = await this.prisma.maintenanceLog.findFirst({ where: { id, tenantId } });
    if (!log) throw new NotFoundException('Maintenance log not found');
    return this.prisma.maintenanceLog.delete({ where: { id } });
  }
}

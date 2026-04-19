import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectStatus, Role } from '@prisma/client';
import { isValidTransition } from '@obraflux/shared';
import { getPaginationParams, buildPaginationMeta } from '@obraflux/database';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, opts: {
    page?: number;
    limit?: number;
    search?: string;
    status?: ProjectStatus;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    userId?: string;
    userRole?: Role;
  } = {}) {
    const { skip, take, page, limit } = getPaginationParams({ page: opts.page, limit: opts.limit });
    const where: Record<string, unknown> = {
      tenantId,
      deletedAt: null,
      ...(opts.status && { status: opts.status }),
      ...(opts.search && { name: { contains: opts.search, mode: 'insensitive' as const } }),
      ...(opts.userRole === Role.CLIENT && opts.userId && {
        members: { some: { userId: opts.userId } },
      }),
    };
    const orderBy = opts.sortBy
      ? { [opts.sortBy]: opts.sortOrder || 'asc' }
      : { updatedAt: 'desc' as const };

    const [projects, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } } },
      }),
      this.prisma.project.count({ where }),
    ]);

    return { data: projects, meta: buildPaginationMeta(total, page, limit) };
  }

  async findById(id: string, tenantId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } } } },
        _count: { select: { timelineEntries: true, transactions: true, files: true } },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async create(tenantId: string, userId: string, data: {
    name: string;
    description?: string;
    address?: string;
    city?: string;
    state?: string;
    startDate?: Date;
    estimatedEnd?: Date;
    contractValue?: number;
    tags?: string[];
  }) {
    const sub = await this.prisma.subscription.findUnique({ where: { tenantId } });
    if (sub && sub.maxProjects !== -1) {
      const count = await this.prisma.project.count({ where: { tenantId, deletedAt: null } });
      if (count >= sub.maxProjects) {
        throw new ForbiddenException('Project limit reached for current plan');
      }
    }

    return this.prisma.project.create({
      data: {
        tenantId,
        ...data,
        members: { create: { userId, role: Role.PROJECT_MANAGER } },
      },
    });
  }

  async update(id: string, tenantId: string, data: Partial<{
    name: string;
    description: string;
    address: string;
    city: string;
    state: string;
    progressPct: number;
    startDate: Date;
    estimatedEnd: Date;
    actualEnd: Date;
    contractValue: number;
    coverImageUrl: string;
    tags: string[];
  }>) {
    await this.findById(id, tenantId);
    return this.prisma.project.update({ where: { id }, data });
  }

  async updateStatus(id: string, tenantId: string, newStatus: ProjectStatus) {
    const project = await this.findById(id, tenantId);
    if (!isValidTransition(project.status as any, newStatus as any)) {
      throw new BadRequestException(`Cannot transition from ${project.status} to ${newStatus}`);
    }
    const data: Partial<{ status: ProjectStatus; actualEnd: Date }> = { status: newStatus };
    if (newStatus === ProjectStatus.COMPLETED) data.actualEnd = new Date();
    return this.prisma.project.update({ where: { id }, data });
  }

  async delete(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    return this.prisma.project.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async addMember(projectId: string, tenantId: string, userId: string, role: Role) {
    await this.findById(projectId, tenantId);
    return this.prisma.projectMember.upsert({
      where: { projectId_userId: { projectId, userId } },
      update: { role },
      create: { projectId, userId, role },
    });
  }

  async removeMember(projectId: string, tenantId: string, userId: string) {
    await this.findById(projectId, tenantId);
    return this.prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });
  }

  async getStats(tenantId: string) {
    const projects = await this.prisma.project.groupBy({
      by: ['status'],
      where: { tenantId, deletedAt: null },
      _count: { id: true },
    });

    const totals = await this.prisma.project.aggregate({
      where: { tenantId, deletedAt: null },
      _sum: { contractValue: true },
      _avg: { progressPct: true },
    });

    return {
      byStatus: Object.fromEntries(projects.map((p) => [p.status, p._count.id])),
      totalContractValue: Number(totals._sum.contractValue ?? 0),
      avgProgress: Math.round(totals._avg.progressPct ?? 0),
    };
  }
}

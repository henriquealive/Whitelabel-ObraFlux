import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TimelineEntryType, Role } from '@prisma/client';
import { getPaginationParams, buildPaginationMeta } from '@obraflux/database';

@Injectable()
export class TimelineService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(projectId: string, tenantId: string, opts: {
    page?: number;
    limit?: number;
    type?: TimelineEntryType;
    startDate?: Date;
    endDate?: Date;
  } = {}) {
    const { skip, take, page, limit } = getPaginationParams({ page: opts.page, limit: opts.limit });
    const where = {
      projectId,
      tenantId,
      deletedAt: null,
      ...(opts.type && { type: opts.type }),
      ...(opts.startDate || opts.endDate
        ? { recordedAt: { gte: opts.startDate, lte: opts.endDate } }
        : {}),
    };

    const [entries, total] = await this.prisma.$transaction([
      this.prisma.timelineEntry.findMany({
        where,
        skip,
        take,
        orderBy: { recordedAt: 'desc' },
        include: { author: { select: { id: true, name: true, avatarUrl: true } }, mediaFiles: true },
      }),
      this.prisma.timelineEntry.count({ where }),
    ]);

    return { data: entries, meta: buildPaginationMeta(total, page, limit) };
  }

  async create(data: {
    tenantId: string;
    projectId: string;
    authorId: string;
    type: TimelineEntryType;
    title?: string;
    content?: string;
    isPinned?: boolean;
    visibleTo?: Role[];
    recordedAt?: Date;
    mediaFiles?: Array<{
      s3Key: string;
      s3Bucket: string;
      fileName: string;
      mimeType: string;
      sizeBytes: bigint;
      order?: number;
    }>;
  }) {
    return this.prisma.timelineEntry.create({
      data: {
        tenantId: data.tenantId,
        projectId: data.projectId,
        authorId: data.authorId,
        type: data.type,
        title: data.title,
        content: data.content,
        isPinned: data.isPinned ?? false,
        visibleTo: data.visibleTo ?? [],
        recordedAt: data.recordedAt ?? new Date(),
        mediaFiles: data.mediaFiles
          ? { createMany: { data: data.mediaFiles } }
          : undefined,
      },
      include: { author: { select: { id: true, name: true, avatarUrl: true } }, mediaFiles: true },
    });
  }

  async update(id: string, tenantId: string, data: Partial<{
    title: string;
    content: string;
    isPinned: boolean;
    visibleTo: Role[];
  }>) {
    const entry = await this.prisma.timelineEntry.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!entry) throw new NotFoundException('Entry not found');
    return this.prisma.timelineEntry.update({ where: { id }, data });
  }

  async delete(id: string, tenantId: string) {
    const entry = await this.prisma.timelineEntry.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!entry) throw new NotFoundException('Entry not found');
    return this.prisma.timelineEntry.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

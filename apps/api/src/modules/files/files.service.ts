import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from './s3.service';
import { FileMimeCategory, Role } from '@prisma/client';
import { getPaginationParams, buildPaginationMeta } from '@obraflux/database';

function getMimeCategory(mimeType: string): FileMimeCategory {
  if (mimeType.startsWith('image/')) return FileMimeCategory.IMAGE;
  if (mimeType.startsWith('video/')) return FileMimeCategory.VIDEO;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv'))
    return FileMimeCategory.SPREADSHEET;
  if (
    mimeType.includes('pdf') ||
    mimeType.includes('word') ||
    mimeType.includes('document') ||
    mimeType.includes('text/')
  )
    return FileMimeCategory.DOCUMENT;
  return FileMimeCategory.OTHER;
}

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  async requestUpload(opts: {
    tenantId: string;
    projectId?: string;
    folderId?: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    uploadedById: string;
  }) {
    const sub = await this.prisma.subscription.findUnique({ where: { tenantId: opts.tenantId } });
    if (sub) {
      const limitBytes = BigInt(sub.storageGb) * BigInt(1_073_741_824);
      if (sub.usedStorageBytes + BigInt(opts.sizeBytes) > limitBytes) {
        throw new ForbiddenException('Storage limit reached');
      }
    }

    const key = this.s3.generateKey(opts.tenantId, opts.projectId, opts.fileName);
    const { url } = await this.s3.getPresignedUploadUrl({
      key,
      contentType: opts.mimeType,
      tenantId: opts.tenantId,
    });

    const file = await this.prisma.file.create({
      data: {
        tenantId: opts.tenantId,
        projectId: opts.projectId ?? null,
        folderId: opts.folderId ?? null,
        uploadedById: opts.uploadedById,
        fileName: key.split('/').pop()!,
        originalName: opts.fileName,
        mimeType: opts.mimeType,
        mimeCategory: getMimeCategory(opts.mimeType),
        sizeBytes: BigInt(opts.sizeBytes),
        s3Key: key,
        s3Bucket: this.s3['bucket'] as string,
      },
    });

    return { uploadUrl: url, fileId: file.id, s3Key: key };
  }

  async confirmUpload(fileId: string, tenantId: string, etag?: string) {
    const file = await this.prisma.file.findFirst({ where: { id: fileId, tenantId } });
    if (!file) throw new NotFoundException('File record not found');
    const updated = await this.prisma.file.update({
      where: { id: fileId },
      data: { s3Etag: etag },
    });
    // Update storage usage
    await this.prisma.subscription.updateMany({
      where: { tenantId },
      data: { usedStorageBytes: { increment: file.sizeBytes } },
    });
    return updated;
  }

  async getDownloadUrl(fileId: string, tenantId: string) {
    const file = await this.prisma.file.findFirst({ where: { id: fileId, tenantId, deletedAt: null } });
    if (!file) throw new NotFoundException('File not found');
    const url = await this.s3.getPresignedDownloadUrl(file.s3Key);
    return { url, fileName: file.originalName, mimeType: file.mimeType };
  }

  async findAll(tenantId: string, opts: {
    projectId?: string;
    folderId?: string;
    page?: number;
    limit?: number;
    mimeCategory?: FileMimeCategory;
  } = {}) {
    const { skip, take, page, limit } = getPaginationParams({ page: opts.page, limit: opts.limit });
    const where = {
      tenantId,
      deletedAt: null,
      ...(opts.projectId && { projectId: opts.projectId }),
      ...(opts.folderId !== undefined && { folderId: opts.folderId }),
      ...(opts.mimeCategory && { mimeCategory: opts.mimeCategory }),
    };
    const [files, total] = await this.prisma.$transaction([
      this.prisma.file.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { uploadedBy: { select: { id: true, name: true, avatarUrl: true } } },
      }),
      this.prisma.file.count({ where }),
    ]);
    return { data: files, meta: buildPaginationMeta(total, page, limit) };
  }

  async createFolder(tenantId: string, data: {
    name: string;
    projectId?: string;
    parentId?: string;
    createdById: string;
    allowedRoles?: Role[];
  }) {
    return this.prisma.folder.create({
      data: {
        tenantId,
        name: data.name,
        projectId: data.projectId,
        parentId: data.parentId,
        createdById: data.createdById,
        allowedRoles: data.allowedRoles ?? [],
      },
    });
  }

  async getFolders(tenantId: string, projectId?: string) {
    return this.prisma.folder.findMany({
      where: { tenantId, projectId: projectId ?? null, deletedAt: null },
      include: { children: { where: { deletedAt: null } }, files: { where: { deletedAt: null }, select: { id: true, originalName: true, mimeType: true, sizeBytes: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async deleteFile(fileId: string, tenantId: string) {
    const file = await this.prisma.file.findFirst({ where: { id: fileId, tenantId, deletedAt: null } });
    if (!file) throw new NotFoundException('File not found');
    await this.s3.deleteObject(file.s3Key);
    await this.prisma.file.update({ where: { id: fileId }, data: { deletedAt: new Date() } });
    await this.prisma.subscription.updateMany({
      where: { tenantId },
      data: { usedStorageBytes: { decrement: file.sizeBytes } },
    });
  }
}

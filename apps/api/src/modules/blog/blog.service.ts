import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BlogPostStatus } from '@prisma/client';
import { getPaginationParams, buildPaginationMeta } from '@obraflux/database';
import slugify from 'slugify';

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, opts: {
    page?: number; limit?: number; status?: BlogPostStatus; search?: string;
  } = {}) {
    const { skip, take, page, limit } = getPaginationParams({ page: opts.page, limit: opts.limit });
    const where = {
      tenantId, deletedAt: null,
      ...(opts.status && { status: opts.status }),
      ...(opts.search && { title: { contains: opts.search, mode: 'insensitive' as const } }),
    };
    const [posts, total] = await this.prisma.$transaction([
      this.prisma.blogPost.findMany({ where, skip, take, orderBy: { publishedAt: 'desc' }, include: { author: { select: { id: true, name: true, avatarUrl: true } } } }),
      this.prisma.blogPost.count({ where }),
    ]);
    return { data: posts, meta: buildPaginationMeta(total, page, limit) };
  }

  async findBySlug(slug: string, tenantId: string) {
    const post = await this.prisma.blogPost.findUnique({ where: { tenantId_slug: { tenantId, slug } }, include: { author: { select: { id: true, name: true, avatarUrl: true } } } });
    if (!post || post.deletedAt) throw new NotFoundException('Post not found');
    if (post.status === BlogPostStatus.PUBLISHED) {
      await this.prisma.blogPost.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } });
    }
    return post;
  }

  async create(tenantId: string, authorId: string, data: {
    title: string; content: string; excerpt?: string; coverImageUrl?: string;
    tags?: string[]; status?: BlogPostStatus;
    metaTitle?: string; metaDescription?: string; ogImageUrl?: string;
  }) {
    const slug = await this.generateSlug(data.title, tenantId);
    const wordCount = data.content.split(/\s+/).length;
    const readingTimeMins = Math.max(1, Math.round(wordCount / 200));
    return this.prisma.blogPost.create({
      data: { tenantId, authorId, slug, readingTimeMins, ...data,
        publishedAt: data.status === BlogPostStatus.PUBLISHED ? new Date() : undefined },
    });
  }

  async update(id: string, tenantId: string, data: Partial<{
    title: string; content: string; excerpt: string; status: BlogPostStatus;
    coverImageUrl: string; tags: string[]; metaTitle: string; metaDescription: string;
  }>) {
    const post = await this.prisma.blogPost.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!post) throw new NotFoundException('Post not found');
    const updateData: typeof data & { publishedAt?: Date } = { ...data };
    if (data.status === BlogPostStatus.PUBLISHED && !post.publishedAt) {
      updateData.publishedAt = new Date();
    }
    return this.prisma.blogPost.update({ where: { id }, data: updateData });
  }

  async delete(id: string, tenantId: string) {
    const post = await this.prisma.blogPost.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!post) throw new NotFoundException('Post not found');
    return this.prisma.blogPost.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private async generateSlug(title: string, tenantId: string): Promise<string> {
    let slug = slugify(title, { lower: true, strict: true });
    const existing = await this.prisma.blogPost.findUnique({ where: { tenantId_slug: { tenantId, slug } } });
    if (existing) slug = `${slug}-${Date.now()}`;
    return slug;
  }
}

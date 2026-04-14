import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DEFAULT_BRANDING } from '@obraflux/shared';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: { branding: true, subscription: true },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async resolve(domain: string) {
    // Try slug first
    let tenant = await this.prisma.tenant.findUnique({
      where: { slug: domain },
      include: { branding: true },
    });
    if (!tenant) {
      // Try custom domain
      tenant = await this.prisma.tenant.findFirst({
        where: { customDomain: domain, isActive: true },
        include: { branding: true },
      });
    }
    if (!tenant) throw new NotFoundException('Tenant not found');

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      customDomain: tenant.customDomain,
      branding: tenant.branding ?? DEFAULT_BRANDING,
    };
  }

  async updateBranding(tenantId: string, data: Partial<{
    logoUrl: string;
    faviconUrl: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    fontFamily: string;
    borderRadius: string;
    companyName: string;
    tagline: string;
    footerText: string;
    supportEmail: string;
    supportPhone: string;
    privacyPolicyUrl: string;
    termsUrl: string;
    customCss: string;
    metaTitle: string;
    metaDescription: string;
    ogImageUrl: string;
  }>) {
    return this.prisma.tenantBranding.upsert({
      where: { tenantId },
      update: data,
      create: { tenantId, ...data },
    });
  }

  async updateCustomDomain(tenantId: string, domain: string | null) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { customDomain: domain },
    });
  }

  async getStats(tenantId: string) {
    const [users, projects, storageResult] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.project.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.file.aggregate({ where: { tenantId }, _sum: { sizeBytes: true } }),
    ]);
    return {
      users,
      projects,
      storageBytes: Number(storageResult._sum.sizeBytes ?? 0),
    };
  }
}

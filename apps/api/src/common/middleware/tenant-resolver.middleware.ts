import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantResolverMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantResolverMiddleware.name);

  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request & { tenantId?: string }, _res: Response, next: NextFunction) {
    // 1. From header (explicit, e.g. SPA sends X-Tenant-ID)
    const headerTenantId = req.headers['x-tenant-id'] as string | undefined;
    if (headerTenantId) {
      req.tenantId = headerTenantId;
      return next();
    }

    // 2. From subdomain: slug.obraflux.com
    const host = req.hostname;
    const rootDomain = process.env.OBRAFLUX_DOMAIN || 'obraflux.com';
    if (host && host.endsWith(`.${rootDomain}`)) {
      const slug = host.replace(`.${rootDomain}`, '');
      try {
        const tenant = await this.prisma.tenant.findUnique({
          where: { slug },
          select: { id: true },
        });
        if (tenant) {
          req.tenantId = tenant.id;
          return next();
        }
      } catch (e) {
        this.logger.warn(`Tenant lookup failed for slug ${slug}: ${e}`);
      }
    }

    // 3. From custom domain
    if (host && !host.includes(rootDomain)) {
      try {
        const tenant = await this.prisma.tenant.findFirst({
          where: { customDomain: host, isActive: true },
          select: { id: true },
        });
        if (tenant) {
          req.tenantId = tenant.id;
          return next();
        }
      } catch (e) {
        this.logger.warn(`Tenant lookup failed for custom domain ${host}: ${e}`);
      }
    }

    // tenantId will be set from JWT claim in the auth strategy if not resolved here
    next();
  }
}

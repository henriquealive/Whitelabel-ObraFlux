import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FeatureFlagKey } from '@obraflux/shared';

@Injectable()
export class FeatureFlagsService {
  constructor(private readonly prisma: PrismaService) {}

  async isEnabled(tenantId: string, key: FeatureFlagKey): Promise<boolean> {
    const flag = await this.prisma.featureFlag.findFirst({
      where: { tenantId, key },
    });
    if (flag) return flag.isEnabled;
    // Fall back to global default
    const global = await this.prisma.featureFlag.findFirst({ where: { tenantId: null, key } });
    return global?.isEnabled ?? false;
  }

  async getAll(tenantId: string) {
    const [tenantFlags, globalFlags] = await this.prisma.$transaction([
      this.prisma.featureFlag.findMany({ where: { tenantId } }),
      this.prisma.featureFlag.findMany({ where: { tenantId: null } }),
    ]);
    const merged = new Map(globalFlags.map((f) => [f.key, f.isEnabled]));
    tenantFlags.forEach((f) => merged.set(f.key, f.isEnabled));
    return Object.fromEntries(merged);
  }

  async setFlag(tenantId: string, key: string, isEnabled: boolean, config?: Record<string, unknown>) {
    return this.prisma.featureFlag.upsert({
      where: { tenantId_key: { tenantId, key } },
      update: { isEnabled, config: config as never },
      create: { tenantId, key, isEnabled, config: config as never },
    });
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CouponType, SubscriptionPlan } from '@prisma/client';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.coupon.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async create(tenantId: string, data: {
    code: string; description?: string; type: CouponType; value: number;
    maxUses?: number; validUntil?: Date; applicablePlans?: SubscriptionPlan[];
  }) {
    return this.prisma.coupon.create({ data: { ...data, tenantId } });
  }

  async validate(code: string, tenantId: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.isActive) throw new NotFoundException('Coupon not found or inactive');
    if (coupon.tenantId && coupon.tenantId !== tenantId) throw new BadRequestException('Coupon not valid for this tenant');
    if (coupon.validUntil && coupon.validUntil < new Date()) throw new BadRequestException('Coupon expired');
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new BadRequestException('Coupon usage limit reached');
    return { code: coupon.code, type: coupon.type, value: Number(coupon.value), description: coupon.description };
  }

  async setActive(id: string, tenantId: string, isActive: boolean) {
    const coupon = await this.prisma.coupon.findFirst({ where: { id, tenantId } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return this.prisma.coupon.update({ where: { id }, data: { isActive } });
  }

  async deactivate(id: string, tenantId: string) {
    return this.setActive(id, tenantId, false);
  }
}

import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getPaginationParams, buildPaginationMeta } from '@obraflux/database';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, page = 1, limit = 20, search?: string) {
    const { skip, take } = getPaginationParams({ page, limit });
    const where = {
      tenantId,
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
      this.prisma.user.count({ where }),
    ]);
    return { data: users.map((u) => this.sanitize(u)), meta: buildPaginationMeta(total, page, limit) };
  }

  async findById(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitize(user);
  }

  async invite(tenantId: string, email: string, role: Role, inviterId: string) {
    const existing = await this.prisma.user.findFirst({ where: { tenantId, email, deletedAt: null } });
    if (existing) throw new ConflictException('User already exists in this tenant');

    const sub = await this.prisma.subscription.findUnique({ where: { tenantId } });
    if (sub && sub.maxUsers !== -1) {
      const count = await this.prisma.user.count({ where: { tenantId, deletedAt: null } });
      if (count >= sub.maxUsers) throw new ForbiddenException('User limit reached for current plan');
    }

    const token = uuidv4();
    const invitation = await this.prisma.invitation.create({
      data: {
        tenantId,
        email,
        role,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        inviterId,
      },
    });
    // TODO: queue invite email
    return invitation;
  }

  async acceptInvite(token: string, name: string, password: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
    });
    if (!invitation || invitation.expiresAt < new Date() || invitation.acceptedAt) {
      throw new NotFoundException('Invalid or expired invitation');
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await this.prisma.user.create({
      data: {
        tenantId: invitation.tenantId,
        email: invitation.email,
        password: hashed,
        name,
        role: invitation.role,
        isEmailVerified: true,
      },
    });
    await this.prisma.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });
    return this.sanitize(user);
  }

  async update(id: string, tenantId: string, data: Partial<{ name: string; phone: string; avatarUrl: string }>) {
    await this.findById(id, tenantId);
    const updated = await this.prisma.user.update({ where: { id }, data });
    return this.sanitize(updated);
  }

  async updateRole(id: string, tenantId: string, role: Role, actorRole: Role) {
    if (actorRole !== 'ADMIN' && actorRole !== 'SUPER_ADMIN') throw new ForbiddenException();
    await this.findById(id, tenantId);
    const updated = await this.prisma.user.update({ where: { id }, data: { role } });
    return this.sanitize(updated);
  }

  async deactivate(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    return this.prisma.user.update({ where: { id }, data: { isActive: false } });
  }

  async delete(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    return this.prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  sanitize(user: User) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, twoFactorSecret, backupCodes, emailVerifyToken, passwordResetToken, ...safe } = user;
    return safe;
  }
}

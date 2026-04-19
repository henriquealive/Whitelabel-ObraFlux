import { Injectable, NotFoundException, ConflictException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { getPaginationParams, buildPaginationMeta } from '@obraflux/database';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

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
    // Send invite email (non-blocking — failure should not abort the invite)
    this.sendInviteEmail(email, token, tenantId).catch((err) =>
      this.logger.warn(`Failed to send invite email to ${email}: ${err.message}`),
    );
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

  private async sendInviteEmail(email: string, token: string, tenantId: string) {
    const host = this.config.get<string>('mail.host', 'localhost');
    const port = this.config.get<number>('mail.port', 1025);
    const user = this.config.get<string>('mail.user', '');
    const pass = this.config.get<string>('mail.pass', '');
    const from = this.config.get<string>('mail.from', 'noreply@obraflux.com');
    const appUrl = this.config.get<string>('app.url', 'https://obraflux.netlify.app');

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, branding: { select: { companyName: true } } },
    });
    const companyName = tenant?.branding?.companyName ?? tenant?.name ?? 'ObraFlux';
    const inviteUrl = `${appUrl}/accept-invite?token=${token}`;

    const transporter = nodemailer.createTransport({ host, port, auth: user ? { user, pass } : undefined });
    await transporter.sendMail({
      from,
      to: email,
      subject: `Convite para ${companyName}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2>Você foi convidado para ${companyName}</h2>
          <p>Clique no botão abaixo para aceitar o convite e criar sua conta.</p>
          <a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
            Aceitar convite
          </a>
          <p style="color:#6b7280;font-size:13px;margin-top:24px">
            O link expira em 7 dias. Se você não esperava este convite, ignore este email.
          </p>
        </div>
      `,
    });
  }

  sanitize(user: User) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, twoFactorSecret, backupCodes, emailVerifyToken, passwordResetToken, ...safe } = user;
    return safe;
  }
}

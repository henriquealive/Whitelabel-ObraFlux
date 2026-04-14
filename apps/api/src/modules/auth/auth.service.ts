import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { TotpService } from './totp.service';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SubscriptionPlan, SubscriptionStatus, BillingInterval } from '@prisma/client';
import { TRIAL_DAYS, PLAN_LIMITS } from '@obraflux/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly totpService: TotpService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if tenant slug is taken
    const existing = await this.prisma.tenant.findUnique({ where: { slug: dto.tenantSlug } });
    if (existing) throw new ConflictException('Tenant slug already taken');

    const existingEmail = await this.prisma.user.findFirst({ where: { email: dto.email } });
    if (existingEmail) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    const limits = PLAN_LIMITS[SubscriptionPlan.BASIC];

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.companyName,
        slug: dto.tenantSlug,
        branding: {
          create: {
            companyName: dto.companyName,
          },
        },
        subscription: {
          create: {
            plan: SubscriptionPlan.BASIC,
            status: SubscriptionStatus.TRIALING,
            billingInterval: BillingInterval.MONTHLY,
            trialEndsAt,
            maxUsers: limits.maxUsers,
            maxProjects: limits.maxProjects,
            storageGb: limits.storageGb,
          },
        },
        users: {
          create: {
            email: dto.email,
            password: hashedPassword,
            name: dto.name,
            role: 'ADMIN',
            isEmailVerified: false,
            emailVerifyToken: uuidv4(),
          },
        },
      },
      include: { users: true },
    });

    const user = tenant.users[0];
    const tokens = await this.generateTokens(user.id, user.email, tenant.id, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.usersService.sanitize(user),
      tokens,
      requiresTwoFactor: false,
    };
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
      include: { tenant: { select: { id: true, isActive: true } } },
    });

    if (!user || !user.password) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account deactivated');
    if (!user.tenant.isActive) throw new UnauthorizedException('Tenant account suspended');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (user.twoFactorEnabled) {
      // Issue a short-lived pre-auth token, client must complete 2FA
      const preAuthToken = this.jwtService.sign(
        { sub: user.id, twoFactor: true },
        { expiresIn: '5m' },
      );
      return { requiresTwoFactor: true, preAuthToken, user: this.usersService.sanitize(user) };
    }

    const tokens = await this.generateTokens(user.id, user.email, user.tenantId, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken, ip, userAgent);

    await this.prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
        ip,
        userAgent,
      },
    });

    return { user: this.usersService.sanitize(user), tokens, requiresTwoFactor: false };
  }

  async verifyTwoFactor(userId: string, totpCode: string, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) throw new UnauthorizedException();

    const valid = this.totpService.verify(user.twoFactorSecret, totpCode);
    if (!valid) throw new UnauthorizedException('Invalid 2FA code');

    const tokens = await this.generateTokens(user.id, user.email, user.tenantId, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken, ip, userAgent);
    return { user: this.usersService.sanitize(user), tokens };
  }

  async refreshTokens(token: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      // Token reuse: revoke entire family
      if (stored) {
        await this.prisma.refreshToken.updateMany({
          where: { family: stored.family },
          data: { revokedAt: new Date() },
        });
      }
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Rotate: revoke old, issue new
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });

    const { user } = stored;
    const tokens = await this.generateTokens(user.id, user.email, user.tenantId, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken, undefined, undefined, stored.family);
    return tokens;
  }

  async logout(userId: string, token: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, token },
      data: { revokedAt: new Date() },
    });
    await this.prisma.auditLog.create({
      data: {
        tenantId: (await this.prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } }))!.tenantId,
        userId,
        action: 'LOGOUT',
        entity: 'User',
        entityId: userId,
      },
    });
  }

  async setupTwoFactor(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const { secret, otpauthUrl } = this.totpService.generate(user.email);
    const qrCode = await this.totpService.generateQrCode(otpauthUrl);
    // Store secret temporarily (not enabled until confirmed)
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret } });
    return { qrCode, secret };
  }

  async confirmTwoFactor(userId: string, totpCode: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.twoFactorSecret) throw new BadRequestException('Setup 2FA first');
    const valid = this.totpService.verify(user.twoFactorSecret, totpCode);
    if (!valid) throw new BadRequestException('Invalid TOTP code');
    const backupCodes = this.totpService.generateBackupCodes();
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true, backupCodes },
    });
    return { backupCodes };
  }

  async forgotPassword(email: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({ where: { email, tenantId } });
    if (!user) return; // Silent fail
    const token = uuidv4();
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetAt: new Date(Date.now() + 3600_000) },
    });
    // TODO: queue email via BullMQ
    return token;
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: { passwordResetToken: token, passwordResetAt: { gt: new Date() } },
    });
    if (!user) throw new BadRequestException('Invalid or expired token');
    const hashed = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, passwordResetToken: null, passwordResetAt: null },
    });
  }

  private async generateTokens(userId: string, email: string, tenantId: string, role: string) {
    const payload = { sub: userId, email, tenantId, role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.secret'),
      expiresIn: this.configService.get('jwt.expiresIn'),
    });
    const refreshToken = uuidv4();
    return { accessToken, refreshToken, expiresIn: 900 };
  }

  private async saveRefreshToken(
    userId: string,
    token: string,
    ip?: string,
    userAgent?: string,
    family?: string,
  ) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: { userId, token, family: family ?? uuidv4(), expiresAt, ip, userAgent },
    });
  }
}

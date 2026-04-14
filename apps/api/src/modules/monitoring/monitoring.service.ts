import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class MonitoringService {
  private readonly algorithm = 'aes-256-gcm';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getCameras(projectId: string, tenantId: string) {
    return this.prisma.camera.findMany({
      where: { projectId, tenantId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, description: true, location: true, isActive: true, thumbnailS3Key: true },
    });
  }

  async addCamera(data: {
    tenantId: string;
    projectId: string;
    name: string;
    rtspUrl: string;
    description?: string;
    location?: string;
  }) {
    const encryptedRtsp = this.encrypt(data.rtspUrl);
    return this.prisma.camera.create({
      data: { ...data, rtspUrl: encryptedRtsp },
    });
  }

  async removeCamera(id: string, tenantId: string) {
    const camera = await this.prisma.camera.findFirst({ where: { id, tenantId } });
    if (!camera) throw new NotFoundException('Camera not found');
    return this.prisma.camera.delete({ where: { id } });
  }

  async getCameraStream(id: string, tenantId: string) {
    const camera = await this.prisma.camera.findFirst({ where: { id, tenantId, isActive: true } });
    if (!camera) throw new NotFoundException('Camera not found or inactive');
    const rtspUrl = this.decrypt(camera.rtspUrl);
    const go2rtcBase = this.configService.get<string>('GO2RTC_URL', 'http://localhost:1984');
    return { go2rtcUrl: go2rtcBase, rtspUrl, cameraId: id };
  }

  private encrypt(text: string): string {
    const key = Buffer.from(this.configService.get<string>('app.encryptionKey', '').padEnd(64, '0').slice(0, 64), 'hex');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
  }

  private decrypt(data: string): string {
    const [ivHex, tagHex, encryptedHex] = data.split(':');
    const key = Buffer.from(this.configService.get<string>('app.encryptionKey', '').padEnd(64, '0').slice(0, 64), 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted) + decipher.final('utf8');
  }
}

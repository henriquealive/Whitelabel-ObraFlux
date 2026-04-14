import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as OTPAuth from 'otpauth';
import * as QRCode from 'qrcode';
import { randomBytes } from 'crypto';

@Injectable()
export class TotpService {
  constructor(private readonly configService: ConfigService) {}

  generate(email: string) {
    const totp = new OTPAuth.TOTP({
      issuer: this.configService.get<string>('app.totpAppName', 'ObraFlux'),
      label: email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: new OTPAuth.Secret(),
    });

    return {
      secret: totp.secret.base32,
      otpauthUrl: totp.toString(),
    };
  }

  verify(secret: string, token: string): boolean {
    const totp = new OTPAuth.TOTP({
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });
    const delta = totp.validate({ token, window: 1 });
    return delta !== null;
  }

  async generateQrCode(otpauthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpauthUrl);
  }

  generateBackupCodes(count = 10): string[] {
    return Array.from({ length: count }, () =>
      randomBytes(5).toString('hex').toUpperCase(),
    );
  }
}

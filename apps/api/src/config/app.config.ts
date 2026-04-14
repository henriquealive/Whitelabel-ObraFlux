import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  domain: process.env.OBRAFLUX_DOMAIN || 'obraflux.com',
  encryptionKey: process.env.ENCRYPTION_KEY || '',
  totpAppName: process.env.TOTP_APP_NAME || 'ObraFlux',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
}));

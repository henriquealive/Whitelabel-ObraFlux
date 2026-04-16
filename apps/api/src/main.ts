import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ExpressAdapter } from '@nestjs/platform-express';
import helmet from 'helmet';
import express, { Request, Response } from 'express';
import * as http from 'http';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const port = parseInt(process.env.PORT ?? '3001', 10);

  // Create an Express instance and start listening IMMEDIATELY so Railway's
  // health check passes while NestJS initialises (PrismaService.$connect,
  // module wiring etc. can take 10-30 s on a cold start).
  const expressApp = express();
  expressApp.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  http.createServer(expressApp).listen(port);

  // Bootstrap NestJS onto the same Express instance (does NOT bind a new port).
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    rawBody: true, // required for Stripe webhook signature verification
  });

  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Security
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGINS', 'http://localhost:3000').split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // API versioning
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global filters & interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger (dev/staging only)
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('ObraFlux API')
      .setDescription('WhiteLabel SaaS for Architecture & Engineering')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth')
      .addTag('tenants')
      .addTag('users')
      .addTag('projects')
      .addTag('timeline')
      .addTag('financial')
      .addTag('files')
      .addTag('monitoring')
      .addTag('blog')
      .addTag('coupons')
      .addTag('maintenance')
      .addTag('subscriptions')
      .addTag('notifications')
      .addTag('audit')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Attach all NestJS routes to the already-listening Express instance.
  await app.init();

  console.log(`🚀 ObraFlux API running on http://localhost:${port}/api`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();

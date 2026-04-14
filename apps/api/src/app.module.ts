import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { redisConfig } from './config/redis.config';
import { jwtConfig } from './config/jwt.config';
import { awsConfig } from './config/aws.config';
import { stripeConfig } from './config/stripe.config';
import { mailConfig } from './config/mail.config';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TimelineModule } from './modules/timeline/timeline.module';
import { FinancialModule } from './modules/financial/financial.module';
import { FilesModule } from './modules/files/files.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { BlogModule } from './modules/blog/blog.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module';
import { QueuesModule } from './queues/queues.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TenantResolverMiddleware } from './common/middleware/tenant-resolver.middleware';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, jwtConfig, awsConfig, stripeConfig, mailConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 20 },
      { name: 'medium', ttl: 60000, limit: 200 },
    ]),
    ScheduleModule.forRoot(),
    PrismaModule,
    QueuesModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    ProjectsModule,
    TimelineModule,
    FinancialModule,
    FilesModule,
    MonitoringModule,
    BlogModule,
    CouponsModule,
    MaintenanceModule,
    SubscriptionsModule,
    NotificationsModule,
    AuditModule,
    FeatureFlagsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware, TenantResolverMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}

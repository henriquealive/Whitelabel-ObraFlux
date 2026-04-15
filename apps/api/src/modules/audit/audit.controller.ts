import { Controller, Get, Post, Delete, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditAction } from '@prisma/client';
import { Role } from '@obraflux/shared';

@ApiTags('audit')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(@TenantId() tenantId: string, @Query('page') page?: number, @Query('limit') limit?: number, @Query('userId') userId?: string, @Query('entity') entity?: string, @Query('action') action?: AuditAction) {
    return this.auditService.findAll(tenantId, { page, limit, userId, entity, action });
  }

  @Get('users/:userId/export')
  exportUserData(@Param('userId') userId: string, @TenantId() tenantId: string) {
    return this.auditService.exportUserData(userId, tenantId);
  }

  @Delete('users/:userId/data')
  deleteUserData(@Param('userId') userId: string, @TenantId() tenantId: string) {
    return this.auditService.deleteUserData(userId, tenantId);
  }
}

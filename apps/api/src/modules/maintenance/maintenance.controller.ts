import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MaintenanceService } from './maintenance.service';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MaintenanceStatus } from '@prisma/client';

@ApiTags('maintenance')
@ApiBearerAuth()
@Controller('projects/:projectId/maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  findAll(@Param('projectId') projectId: string, @TenantId() tenantId: string, @Query('page') page?: number, @Query('status') status?: MaintenanceStatus) {
    return this.maintenanceService.findAll(projectId, tenantId, { page, status });
  }

  @Post()
  create(@Param('projectId') projectId: string, @TenantId() tenantId: string, @CurrentUser() user: { id: string }, @Body() body: { title: string; description: string; priority?: number; category?: string; dueDate?: Date }) {
    return this.maintenanceService.create({ ...body, projectId, tenantId, reportedById: user.id });
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @TenantId() tenantId: string, @Body() body: { status: MaintenanceStatus; notes?: string }) {
    return this.maintenanceService.updateStatus(id, tenantId, body.status, body.notes);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.maintenanceService.delete(id, tenantId);
  }
}

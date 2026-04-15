import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MonitoringService } from './monitoring.service';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@obraflux/shared';

@ApiTags('monitoring')
@ApiBearerAuth()
@Controller('projects/:projectId/monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('cameras')
  getCameras(@Param('projectId') projectId: string, @TenantId() tenantId: string) {
    return this.monitoringService.getCameras(projectId, tenantId);
  }

  @Post('cameras')
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER)
  addCamera(
    @Param('projectId') projectId: string,
    @TenantId() tenantId: string,
    @Body() body: { name: string; rtspUrl: string; description?: string; location?: string },
  ) {
    return this.monitoringService.addCamera({ ...body, projectId, tenantId });
  }

  @Delete('cameras/:cameraId')
  @Roles(Role.ADMIN)
  removeCamera(@Param('cameraId') cameraId: string, @TenantId() tenantId: string) {
    return this.monitoringService.removeCamera(cameraId, tenantId);
  }
}

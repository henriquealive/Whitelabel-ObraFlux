import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ProjectStatus } from '@prisma/client';
import { Role } from '@obraflux/shared';

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll(
    @TenantId() tenantId: string,
    @CurrentUser() user: { id: string; role: Role },
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: ProjectStatus,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.projectsService.findAll(tenantId, { page, limit, search, status, sortBy, sortOrder, userId: user.id, userRole: user.role });
  }

  @Get('stats')
  getStats(@TenantId() tenantId: string) {
    return this.projectsService.getStats(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.projectsService.findById(id, tenantId);
  }

  @Post()
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER)
  create(@TenantId() tenantId: string, @CurrentUser() user: { id: string }, @Body() body: {
    name: string;
    description?: string;
    address?: string;
    city?: string;
    state?: string;
    startDate?: Date;
    estimatedEnd?: Date;
    contractValue?: number;
    tags?: string[];
  }) {
    return this.projectsService.create(tenantId, user.id, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @TenantId() tenantId: string, @Body() body: Record<string, unknown>) {
    return this.projectsService.update(id, tenantId, body as Parameters<ProjectsService['update']>[2]);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() body: { status: ProjectStatus },
  ) {
    return this.projectsService.updateStatus(id, tenantId, body.status);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER)
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.projectsService.delete(id, tenantId);
  }

  @Post(':id/members')
  addMember(
    @Param('id') projectId: string,
    @TenantId() tenantId: string,
    @Body() body: { userId: string; role: Role },
  ) {
    return this.projectsService.addMember(projectId, tenantId, body.userId, body.role);
  }

  @Delete(':id/members/:userId')
  removeMember(
    @Param('id') projectId: string,
    @Param('userId') userId: string,
    @TenantId() tenantId: string,
  ) {
    return this.projectsService.removeMember(projectId, tenantId, userId);
  }
}

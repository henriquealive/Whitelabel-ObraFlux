import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TimelineService } from './timeline.service';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TimelineEntryType } from '@prisma/client';

@ApiTags('timeline')
@ApiBearerAuth()
@Controller('projects/:projectId/timeline')
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @TenantId() tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: TimelineEntryType,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ) {
    return this.timelineService.findAll(projectId, tenantId, { page, limit, type, startDate, endDate });
  }

  @Post()
  create(
    @Param('projectId') projectId: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Body() body: Parameters<TimelineService['create']>[0],
  ) {
    return this.timelineService.create({ ...body, projectId, tenantId, authorId: user.id });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() body: Parameters<TimelineService['update']>[2],
  ) {
    return this.timelineService.update(id, tenantId, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.timelineService.delete(id, tenantId);
  }
}

import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BlogService } from './blog.service';
import { Public } from '../../common/decorators/public.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { BlogPostStatus, Role } from '@prisma/client';

@ApiTags('blog')
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  @ApiBearerAuth()
  findAll(@TenantId() tenantId: string, @Query('page') page?: number, @Query('limit') limit?: number, @Query('status') status?: BlogPostStatus, @Query('search') search?: string) {
    return this.blogService.findAll(tenantId, { page, limit, status, search });
  }

  @Public()
  @Get('public/:slug')
  findBySlug(@Param('slug') slug: string, @Query('tenantId') tenantId: string) {
    return this.blogService.findBySlug(slug, tenantId);
  }

  @Post()
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER)
  create(@TenantId() tenantId: string, @CurrentUser() user: { id: string }, @Body() body: Parameters<BlogService['create']>[2]) {
    return this.blogService.create(tenantId, user.id, body);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER)
  update(@Param('id') id: string, @TenantId() tenantId: string, @Body() body: Parameters<BlogService['update']>[2]) {
    return this.blogService.update(id, tenantId, body);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.blogService.delete(id, tenantId);
  }
}

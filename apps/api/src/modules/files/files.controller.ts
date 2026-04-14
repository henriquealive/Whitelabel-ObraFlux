import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FileMimeCategory } from '@prisma/client';

@ApiTags('files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  findAll(
    @TenantId() tenantId: string,
    @Query('projectId') projectId?: string,
    @Query('folderId') folderId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('mimeCategory') mimeCategory?: FileMimeCategory,
  ) {
    return this.filesService.findAll(tenantId, { projectId, folderId, page, limit, mimeCategory });
  }

  @Post('request-upload')
  requestUpload(
    @TenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Body() body: { fileName: string; mimeType: string; sizeBytes: number; projectId?: string; folderId?: string },
  ) {
    return this.filesService.requestUpload({ ...body, tenantId, uploadedById: user.id });
  }

  @Post(':id/confirm-upload')
  confirmUpload(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() body: { etag?: string },
  ) {
    return this.filesService.confirmUpload(id, tenantId, body.etag);
  }

  @Get(':id/download')
  getDownloadUrl(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.filesService.getDownloadUrl(id, tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.filesService.deleteFile(id, tenantId);
  }

  @Get('folders')
  getFolders(@TenantId() tenantId: string, @Query('projectId') projectId?: string) {
    return this.filesService.getFolders(tenantId, projectId);
  }

  @Post('folders')
  createFolder(
    @TenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Body() body: { name: string; projectId?: string; parentId?: string },
  ) {
    return this.filesService.createFolder(tenantId, { ...body, createdById: user.id });
  }
}

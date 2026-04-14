import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(
    @TenantId() tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll(tenantId, page, limit, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.usersService.findById(id, tenantId);
  }

  @Post('invite')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  invite(
    @TenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Body() body: { email: string; role: Role },
  ) {
    return this.usersService.invite(tenantId, body.email, body.role, user.id);
  }

  @Post('accept-invite')
  acceptInvite(@Body() body: { token: string; name: string; password: string }) {
    return this.usersService.acceptInvite(body.token, body.name, body.password);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() body: { name?: string; phone?: string; avatarUrl?: string },
  ) {
    return this.usersService.update(id, tenantId, body);
  }

  @Patch(':id/role')
  @Roles(Role.ADMIN)
  updateRole(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @CurrentUser() actor: { role: Role },
    @Body() body: { role: Role },
  ) {
    return this.usersService.updateRole(id, tenantId, body.role, actor.role);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.usersService.delete(id, tenantId);
  }
}

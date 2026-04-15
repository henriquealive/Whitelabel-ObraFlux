import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@obraflux/shared';

@ApiTags('coupons')
@ApiBearerAuth()
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get()
  @Roles(Role.ADMIN)
  findAll(@TenantId() tenantId: string) {
    return this.couponsService.findAll(tenantId);
  }

  @Get('validate')
  validate(@Query('code') code: string, @TenantId() tenantId: string) {
    return this.couponsService.validate(code, tenantId);
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@TenantId() tenantId: string, @Body() body: Parameters<CouponsService['create']>[1]) {
    return this.couponsService.create(tenantId, body);
  }

  @Patch(':id/deactivate')
  @Roles(Role.ADMIN)
  deactivate(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.couponsService.deactivate(id, tenantId);
  }
}

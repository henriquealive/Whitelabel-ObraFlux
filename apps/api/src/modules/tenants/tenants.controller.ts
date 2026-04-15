import { Controller, Get, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { Public } from '../../common/decorators/public.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@obraflux/shared';

@ApiTags('tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Public()
  @Get('resolve')
  resolve(@Query('domain') domain: string) {
    return this.tenantsService.resolve(domain);
  }

  @Get('me')
  @ApiBearerAuth()
  getMyTenant(@TenantId() tenantId: string) {
    return this.tenantsService.findById(tenantId);
  }

  @Get('me/stats')
  @ApiBearerAuth()
  getStats(@TenantId() tenantId: string) {
    return this.tenantsService.getStats(tenantId);
  }

  @Patch('me/branding')
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  updateBranding(@TenantId() tenantId: string, @Body() body: Record<string, string>) {
    return this.tenantsService.updateBranding(tenantId, body);
  }

  @Patch('me/custom-domain')
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  updateCustomDomain(@TenantId() tenantId: string, @Body() body: { domain: string | null }) {
    return this.tenantsService.updateCustomDomain(tenantId, body.domain);
  }
}

import { Controller, Get, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FeatureFlagsService } from './feature-flags.service';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('feature-flags')
@ApiBearerAuth()
@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  getAll(@TenantId() tenantId: string) {
    return this.featureFlagsService.getAll(tenantId);
  }

  @Put(':key')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  setFlag(@Param('key') key: string, @TenantId() tenantId: string, @Body() body: { isEnabled: boolean; config?: Record<string, unknown> }) {
    return this.featureFlagsService.setFlag(tenantId, key, body.isEnabled, body.config);
  }
}

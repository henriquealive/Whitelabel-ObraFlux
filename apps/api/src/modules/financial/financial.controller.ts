import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FinancialService } from './financial.service';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApprovalStatus, TransactionType } from '@prisma/client';

@ApiTags('financial')
@ApiBearerAuth()
@Controller('projects/:projectId/financial')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Get('summary')
  getSummary(@Param('projectId') projectId: string, @TenantId() tenantId: string) {
    return this.financialService.getSummary(projectId, tenantId);
  }

  @Get('transactions')
  findTransactions(
    @Param('projectId') projectId: string,
    @TenantId() tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: TransactionType,
    @Query('approvalStatus') approvalStatus?: ApprovalStatus,
  ) {
    return this.financialService.findTransactions(projectId, tenantId, { page, limit, type, approvalStatus });
  }

  @Post('transactions')
  createTransaction(
    @Param('projectId') projectId: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Body() body: Omit<Parameters<FinancialService['createTransaction']>[0], 'projectId' | 'tenantId' | 'createdById'>,
  ) {
    return this.financialService.createTransaction({ ...body, projectId, tenantId, createdById: user.id });
  }

  @Post('transactions/:txId/approve')
  approve(
    @Param('txId') txId: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Body() body: { status: ApprovalStatus; comment?: string },
  ) {
    return this.financialService.approveTransaction(txId, tenantId, user.id, body.status, body.comment);
  }

  @Get('budgets')
  getBudgets(@Param('projectId') projectId: string, @TenantId() tenantId: string) {
    return this.financialService.getBudgets(projectId, tenantId);
  }

  @Post('budgets')
  createBudget(
    @Param('projectId') projectId: string,
    @TenantId() tenantId: string,
    @Body() body: Omit<Parameters<FinancialService['createBudget']>[0], 'projectId' | 'tenantId'>,
  ) {
    return this.financialService.createBudget({ ...body, projectId, tenantId });
  }
}

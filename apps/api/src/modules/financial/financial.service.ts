import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionType, ApprovalStatus } from '@prisma/client';
import { getPaginationParams, buildPaginationMeta } from '@obraflux/database';

@Injectable()
export class FinancialService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(projectId: string, tenantId: string) {
    const result = await this.prisma.financialTransaction.groupBy({
      by: ['type'],
      where: { projectId, tenantId, deletedAt: null },
      _sum: { amount: true },
    });

    const revenue = Number(result.find((r) => r.type === TransactionType.REVENUE)?._sum.amount ?? 0);
    const expense = Number(result.find((r) => r.type === TransactionType.EXPENSE)?._sum.amount ?? 0);
    const pending = await this.prisma.financialTransaction.count({
      where: { projectId, tenantId, approvalStatus: ApprovalStatus.PENDING },
    });

    const budgets = await this.prisma.budget.findMany({ where: { projectId, tenantId }, include: { categories: true } });
    const budgetTotal = budgets.reduce((sum, b) => sum + Number(b.totalAmount), 0);

    return {
      totalRevenue: revenue,
      totalExpenses: expense,
      balance: revenue - expense,
      pendingApprovals: pending,
      budgetedAmount: budgetTotal,
      usedAmount: expense,
    };
  }

  async findTransactions(projectId: string, tenantId: string, opts: {
    page?: number;
    limit?: number;
    type?: TransactionType;
    approvalStatus?: ApprovalStatus;
  } = {}) {
    const { skip, take, page, limit } = getPaginationParams({ page: opts.page, limit: opts.limit });
    const where = {
      projectId,
      tenantId,
      deletedAt: null,
      ...(opts.type && { type: opts.type }),
      ...(opts.approvalStatus && { approvalStatus: opts.approvalStatus }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.financialTransaction.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true } },
          approvals: { include: { user: { select: { id: true, name: true } } } },
          budgetCategory: { select: { id: true, name: true } },
        },
      }),
      this.prisma.financialTransaction.count({ where }),
    ]);
    return { data: items, meta: buildPaginationMeta(total, page, limit) };
  }

  async createTransaction(data: {
    tenantId: string;
    projectId: string;
    createdById: string;
    type: TransactionType;
    description: string;
    amount: number;
    currency?: string;
    dueDate?: Date;
    budgetCategoryId?: string;
    vendor?: string;
    invoiceNumber?: string;
    notes?: string;
    tags?: string[];
  }) {
    return this.prisma.financialTransaction.create({ data: { ...data, amount: data.amount } });
  }

  async approveTransaction(transactionId: string, tenantId: string, userId: string, status: ApprovalStatus, comment?: string) {
    const tx = await this.prisma.financialTransaction.findFirst({ where: { id: transactionId, tenantId } });
    if (!tx) throw new NotFoundException('Transaction not found');

    await this.prisma.financialApproval.create({
      data: { transactionId, userId, status, comment },
    });
    return this.prisma.financialTransaction.update({
      where: { id: transactionId },
      data: { approvalStatus: status },
    });
  }

  async createBudget(data: {
    tenantId: string;
    projectId: string;
    name: string;
    totalAmount: number;
    notes?: string;
    startDate?: Date;
    endDate?: Date;
    categories?: Array<{ name: string; allocatedAmt: number }>;
  }) {
    return this.prisma.budget.create({
      data: {
        tenantId: data.tenantId,
        projectId: data.projectId,
        name: data.name,
        totalAmount: data.totalAmount,
        notes: data.notes,
        startDate: data.startDate,
        endDate: data.endDate,
        categories: data.categories ? { createMany: { data: data.categories } } : undefined,
      },
      include: { categories: true },
    });
  }

  async getBudgets(projectId: string, tenantId: string) {
    return this.prisma.budget.findMany({
      where: { projectId, tenantId },
      include: {
        categories: {
          include: {
            transactions: {
              where: { deletedAt: null },
              select: { amount: true, type: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

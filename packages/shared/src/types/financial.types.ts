export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  balance: number;
  pendingApprovals: number;
  budgetedAmount: number;
  usedAmount: number;
}

export interface BudgetCategorySummary {
  id: string;
  name: string;
  allocatedAmt: number;
  usedAmt: number;
  remainingAmt: number;
  pct: number;
}

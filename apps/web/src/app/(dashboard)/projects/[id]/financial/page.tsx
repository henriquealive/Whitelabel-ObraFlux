'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

const TYPE_LABELS = { REVENUE: 'Receita', EXPENSE: 'Despesa' };
const APPROVAL_LABELS: Record<string, string> = { PENDING: 'Pendente', APPROVED: 'Aprovado', REJECTED: 'Rejeitado' };
const APPROVAL_COLORS: Record<string, string> = { PENDING: 'bg-amber-100 text-amber-700', APPROVED: 'bg-green-100 text-green-700', REJECTED: 'bg-red-100 text-red-700' };

export default function FinancialPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'summary' | 'transactions' | 'budgets'>('summary');

  const { data: summary } = useQuery<any>({
    queryKey: ['financial-summary', id],
    queryFn: () => api.get(`/v1/projects/${id}/financial/summary`).then((r) => r.data.data ?? r.data),
  });

  const { data: txData } = useQuery<any>({
    queryKey: ['transactions', id],
    queryFn: () => api.get(`/v1/projects/${id}/financial/transactions`).then((r) => r.data.data ?? r.data),
    enabled: tab === 'transactions',
  });

  const { data: budgetData } = useQuery<any>({
    queryKey: ['budgets', id],
    queryFn: () => api.get(`/v1/projects/${id}/financial/budgets`).then((r) => r.data.data ?? r.data),
    enabled: tab === 'budgets',
  });

  const approveMutation = useMutation({
    mutationFn: ({ txId, status }: { txId: string; status: string }) =>
      api.post(`/v1/projects/${id}/financial/transactions/${txId}/approve`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions', id] }),
  });

  const s = summary ?? {};
  const transactions = txData?.data ?? [];
  const budgets = budgetData ?? [];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Financeiro</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <FinCard label="Receitas" value={formatCurrency(s.totalRevenue ?? 0)} color="text-green-600" />
        <FinCard label="Despesas" value={formatCurrency(s.totalExpenses ?? 0)} color="text-red-600" />
        <FinCard label="Saldo" value={formatCurrency(s.balance ?? 0)} color={(s.balance ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'} />
        <FinCard label="Aprovações pendentes" value={s.pendingApprovals ?? 0} />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700 flex gap-4">
        {(['summary', 'transactions', 'budgets'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t === 'summary' ? 'Visão geral' : t === 'transactions' ? 'Transações' : 'Orçamentos'}
          </button>
        ))}
      </div>

      {tab === 'transactions' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {transactions.length === 0 ? (
            <p className="text-center text-slate-400 py-8">Nenhuma transação registrada.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Descrição</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Tipo</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Valor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Data</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {transactions.map((tx: Record<string, unknown>) => (
                  <tr key={tx.id as string} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{tx.description as string}</td>
                    <td className="px-4 py-3 text-slate-500">{TYPE_LABELS[tx.type as string] ?? tx.type as string}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${tx.type === 'REVENUE' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'REVENUE' ? '+' : '-'}{formatCurrency(tx.amount as number)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${APPROVAL_COLORS[tx.approvalStatus as string] || ''}`}>
                        {APPROVAL_LABELS[tx.approvalStatus as string] ?? tx.approvalStatus as string}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(tx.createdAt as string)}</td>
                    <td className="px-4 py-3">
                      {tx.approvalStatus === 'PENDING' && (
                        <div className="flex gap-1">
                          <button onClick={() => approveMutation.mutate({ txId: tx.id as string, status: 'APPROVED' })} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200">✓</button>
                          <button onClick={() => approveMutation.mutate({ txId: tx.id as string, status: 'REJECTED' })} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200">✗</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'budgets' && (
        <div className="space-y-4">
          {budgets.length === 0 ? (
            <div className="text-center text-slate-400 py-8">Nenhum orçamento cadastrado.</div>
          ) : budgets.map((b: Record<string, unknown>) => (
            <div key={b.id as string} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900 dark:text-white">{b.name as string}</h3>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(b.totalAmount as number)}</span>
              </div>
              <div className="space-y-2">
                {((b.categories as Record<string, unknown>[]) ?? []).map((cat: Record<string, unknown>) => {
                  const used = ((cat.transactions as Record<string, unknown>[]) ?? []).reduce((sum: number, t: Record<string, unknown>) => sum + (t.amount as number), 0);
                  const pct = Math.min(100, Math.round((used / (cat.allocatedAmt as number)) * 100));
                  return (
                    <div key={cat.id as string}>
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                        <span>{cat.name as string}</span>
                        <span>{formatCurrency(used)} / {formatCurrency(cat.allocatedAmt as number)}</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FinCard({ label, value, color = 'text-slate-900' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{label}</p>
      <p className={`text-xl font-bold mt-1 ${color} dark:text-white`}>{value}</p>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

const PLAN_LABELS = { BASIC: 'Básico', PROFESSIONAL: 'Profissional', ENTERPRISE: 'Enterprise' };
const STATUS_LABELS: Record<string, string> = { TRIALING: 'Trial', ACTIVE: 'Ativo', PAST_DUE: 'Pagamento pendente', CANCELED: 'Cancelado', INCOMPLETE: 'Incompleto' };
const STATUS_COLORS: Record<string, string> = { TRIALING: 'bg-blue-100 text-blue-700', ACTIVE: 'bg-green-100 text-green-700', PAST_DUE: 'bg-amber-100 text-amber-700', CANCELED: 'bg-red-100 text-red-700', INCOMPLETE: 'bg-slate-100 text-slate-600' };

export default function BillingPage() {
  const [billingInterval, setBillingInterval] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');

  const { data: sub } = useQuery<any>({
    queryKey: ['subscription'],
    queryFn: () => api.get('/v1/subscriptions').then((r) => r.data.data ?? r.data),
  });

  const { data: stats } = useQuery<any>({
    queryKey: ['tenant-stats'],
    queryFn: () => api.get('/v1/tenants/me/stats').then((r) => r.data.data ?? r.data),
  });

  const checkoutMutation = useMutation({
    mutationFn: (plan: string) =>
      api.post('/v1/subscriptions/checkout', { plan, interval: billingInterval, successUrl: `${window.location.origin}/settings/billing?success=1`, cancelUrl: `${window.location.origin}/settings/billing` })
        .then((r) => (r.data.data ?? r.data).url as string),
    onSuccess: (url) => window.location.href = url,
  });

  const portalMutation = useMutation({
    mutationFn: () =>
      api.post('/v1/subscriptions/portal', { returnUrl: window.location.href })
        .then((r) => (r.data.data ?? r.data).url as string),
    onSuccess: (url) => window.location.href = url,
  });

  const PLANS = [
    { id: 'BASIC', name: 'Básico', price: { MONTHLY: 197.90, ANNUAL: 147.90 }, features: ['5 usuários', '3 projetos', '5 GB storage', 'Timeline & Arquivos', 'Blog'] },
    { id: 'PROFESSIONAL', name: 'Profissional', price: { MONTHLY: 297, ANNUAL: 238 }, features: ['20 usuários', '20 projetos', '50 GB storage', 'Financeiro', 'Manutenção', 'Cupons'], highlight: true },
    { id: 'ENTERPRISE', name: 'Enterprise', price: { MONTHLY: 797, ANNUAL: 638 }, features: ['50 usuários (+R$15/usuário adicional)', 'Projetos ilimitados', '500 GB storage', 'Monitoramento ao vivo', 'Auditoria LGPD', 'Domínio próprio'] },
  ];

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Assinatura & Cobrança</h1>
        <p className="text-slate-500 text-sm mt-1">Gerencie seu plano e histórico de pagamentos</p>
      </div>

      {/* Current subscription */}
      {sub && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Plano atual: {PLAN_LABELS[sub.plan] ?? sub.plan}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[sub.status] || ''}`}>{STATUS_LABELS[sub.status] ?? sub.status}</span>
                {sub.currentPeriodEnd && <span className="text-xs text-slate-400">Renova em {formatDate(sub.currentPeriodEnd)}</span>}
                {sub.trialEndsAt && sub.status === 'TRIALING' && <span className="text-xs text-slate-400">Trial até {formatDate(sub.trialEndsAt)}</span>}
              </div>
            </div>
            {sub.stripeCustomerId && (
              <button onClick={() => portalMutation.mutate()} disabled={portalMutation.isPending} className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-60">
                {portalMutation.isPending ? 'Abrindo...' : 'Gerenciar no Stripe'}
              </button>
            )}
          </div>

          {/* Usage meters */}
          {stats && (
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <UsageMeter label="Usuários" used={stats.users} max={sub.maxUsers} />
              <UsageMeter label="Projetos" used={stats.projects} max={sub.maxProjects} />
              <UsageMeter label="Storage" used={Math.round(stats.storageBytes / 1e9)} max={sub.storageGb} unit="GB" />
            </div>
          )}
        </div>
      )}

      {/* Pricing plans */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <h2 className="font-semibold text-slate-900 dark:text-white">Planos disponíveis</h2>
          <div className="flex rounded-lg border border-slate-300 overflow-hidden text-sm">
            <button onClick={() => setBillingInterval('MONTHLY')} className={`px-3 py-1 ${billingInterval === 'MONTHLY' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Mensal</button>
            <button onClick={() => setBillingInterval('ANNUAL')} className={`px-3 py-1 ${billingInterval === 'ANNUAL' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Anual <span className="text-xs text-green-500 ml-1">-20%</span></button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <div key={plan.id} className={`relative rounded-xl border p-5 ${plan.highlight ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-800`}>
              {plan.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded-full">Mais popular</div>}
              <h3 className="font-bold text-slate-900 dark:text-white">{plan.name}</h3>
              <div className="my-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(plan.price[billingInterval])}</span>
                <span className="text-slate-400 text-sm">/mês</span>
              </div>
              <ul className="space-y-1.5 mb-4">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="text-green-500">✓</span>{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => checkoutMutation.mutate(plan.id)}
                disabled={checkoutMutation.isPending || sub?.plan === plan.id}
                className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${plan.highlight ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'} disabled:opacity-50`}
              >
                {sub?.plan === plan.id ? 'Plano atual' : 'Assinar'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UsageMeter({ label, used, max, unit = '' }: { label: string; used: number; max: number; unit?: string }) {
  const pct = max === -1 ? 0 : Math.min(100, Math.round((used / max) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-500">{label}</span>
        <span className="text-slate-700 dark:text-slate-300 font-medium">{used}{unit} / {max === -1 ? '∞' : `${max}${unit}`}</span>
      </div>
      {max !== -1 && (
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${pct > 80 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

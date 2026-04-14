'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  maxUses: number | null;
  usedCount: number;
  validFrom: string;
  validUntil: string | null;
  active: boolean;
  description: string | null;
  createdAt: string;
}

export default function CouponsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '',
    type: 'PERCENTAGE',
    value: '',
    maxUses: '',
    validFrom: '',
    validUntil: '',
    description: '',
  });

  const { data, isLoading } = useQuery<any>({
    queryKey: ['coupons'],
    queryFn: () => api.get('/v1/coupons').then((r) => r.data.data ?? r.data),
  });

  const coupons: Coupon[] = data?.data ?? data ?? [];

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post('/v1/coupons', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setShowForm(false);
      setForm({ code: '', type: 'PERCENTAGE', value: '', maxUses: '', validFrom: '', validUntil: '', description: '' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.patch(`/v1/coupons/${id}`, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coupons'] }),
  });

  const handleCreate = () => {
    createMutation.mutate({
      code: form.code.toUpperCase(),
      type: form.type,
      value: parseFloat(form.value),
      ...(form.maxUses && { maxUses: parseInt(form.maxUses) }),
      ...(form.validFrom && { validFrom: new Date(form.validFrom).toISOString() }),
      ...(form.validUntil && { validUntil: new Date(form.validUntil).toISOString() }),
      ...(form.description && { description: form.description }),
    });
  };

  const isExpired = (coupon: Coupon) =>
    coupon.validUntil ? new Date(coupon.validUntil) < new Date() : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cupons</h1>
          <p className="text-slate-500 text-sm">Gerencie cupons de desconto pós-obra</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Novo cupom
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Criar cupom</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Código
              </label>
              <input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="DESCONTO20"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Tipo
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900"
              >
                <option value="PERCENTAGE">Porcentagem (%)</option>
                <option value="FIXED">Valor fixo (R$)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Valor {form.type === 'PERCENTAGE' ? '(%)' : '(R$)'}
              </label>
              <input
                type="number"
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                placeholder={form.type === 'PERCENTAGE' ? '10' : '50.00'}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Usos máximos (opcional)
              </label>
              <input
                type="number"
                value={form.maxUses}
                onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                placeholder="100"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Válido de
              </label>
              <input
                type="datetime-local"
                value={form.validFrom}
                onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Válido até (opcional)
              </label>
              <input
                type="datetime-local"
                value={form.validUntil}
                onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Descrição (opcional)
              </label>
              <input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Desconto especial para clientes pós-obra"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleCreate}
              disabled={!form.code || !form.value || createMutation.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Criando...' : 'Criar cupom'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-sm border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Carregando...</div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-lg mb-1">Nenhum cupom criado</p>
          <p className="text-sm">Crie cupons de desconto para clientes pós-obra</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((coupon) => {
            const expired = isExpired(coupon);
            const exhausted = coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses;
            const status = !coupon.active ? 'inactive' : expired ? 'expired' : exhausted ? 'exhausted' : 'active';

            return (
              <div
                key={coupon.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="font-mono text-lg font-bold text-slate-900 dark:text-white tracking-wider">
                      {coupon.code}
                    </span>
                    {coupon.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{coupon.description}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    status === 'expired' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                    status === 'exhausted' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                    'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                  }`}>
                    {status === 'active' ? 'Ativo' : status === 'expired' ? 'Expirado' : status === 'exhausted' ? 'Esgotado' : 'Inativo'}
                  </span>
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Desconto</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {coupon.type === 'PERCENTAGE' ? `${coupon.value}%` : `R$ ${coupon.value.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Usos</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {coupon.usedCount}{coupon.maxUses !== null ? ` / ${coupon.maxUses}` : ' (ilimitado)'}
                    </span>
                  </div>
                  {coupon.validUntil && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Expira</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {formatDate(coupon.validUntil, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                  {coupon.maxUses !== null && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Utilização</span>
                        <span>{Math.round((coupon.usedCount / coupon.maxUses) * 100)}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${Math.min(100, (coupon.usedCount / coupon.maxUses) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => toggleMutation.mutate({ id: coupon.id, active: !coupon.active })}
                  className={`w-full py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    coupon.active
                      ? 'border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/20'
                      : 'border-green-300 text-green-600 hover:bg-green-50 dark:border-green-700 dark:hover:bg-green-900/20'
                  }`}
                >
                  {coupon.active ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

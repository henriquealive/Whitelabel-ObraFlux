'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTenant } from '@/providers/TenantProvider';

export default function WhiteLabelPage() {
  const { branding: ctx } = useTenant();
  const qc = useQueryClient();

  const { data: tenantData } = useQuery({
    queryKey: ['tenant-me'],
    queryFn: () => api.get('/v1/tenants/me').then((r) => r.data.data ?? r.data),
  });

  const branding = tenantData?.branding ?? ctx;

  const [form, setForm] = useState({
    companyName: branding?.companyName ?? '',
    tagline: branding?.tagline ?? '',
    primaryColor: branding?.primaryColor ?? '#2563EB',
    secondaryColor: branding?.secondaryColor ?? '#7C3AED',
    accentColor: branding?.accentColor ?? '#10B981',
    backgroundColor: branding?.backgroundColor ?? '#FFFFFF',
    fontFamily: branding?.fontFamily ?? 'Inter',
    borderRadius: branding?.borderRadius ?? '8px',
    supportEmail: branding?.supportEmail ?? '',
    footerText: branding?.footerText ?? '',
    metaTitle: branding?.metaTitle ?? '',
    metaDescription: branding?.metaDescription ?? '',
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof form) => api.patch('/v1/tenants/me/branding', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant-me'] }),
  });

  const field = (key: keyof typeof form, label: string, type = 'text') => (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
      />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">White Label</h1>
        <p className="text-slate-500 text-sm mt-1">Personalize a identidade visual da sua conta</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
        <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Empresa</h2>
        <div className="grid grid-cols-2 gap-4">
          {field('companyName', 'Nome da empresa')}
          {field('tagline', 'Slogan')}
          {field('supportEmail', 'E-mail de suporte')}
          {field('footerText', 'Texto do rodapé')}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
        <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Cores</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {field('primaryColor', 'Cor primária', 'color')}
          {field('secondaryColor', 'Cor secundária', 'color')}
          {field('accentColor', 'Cor de destaque', 'color')}
          {field('backgroundColor', 'Fundo', 'color')}
        </div>

        {/* Live preview */}
        <div className="rounded-xl overflow-hidden border border-slate-200">
          <div style={{ backgroundColor: form.primaryColor }} className="h-12 flex items-center px-4 gap-3">
            <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center text-white text-xs font-bold">
              {(form.companyName || 'O').charAt(0)}
            </div>
            <span className="text-white text-sm font-medium">{form.companyName || 'Sua Empresa'}</span>
          </div>
          <div style={{ backgroundColor: form.backgroundColor }} className="p-4 space-y-2">
            <div style={{ backgroundColor: form.secondaryColor, borderRadius: form.borderRadius }} className="inline-block px-3 py-1 text-white text-xs">Módulo exemplo</div>
            <div style={{ backgroundColor: form.accentColor, borderRadius: form.borderRadius }} className="inline-block px-3 py-1 text-white text-xs ml-2">Destaque</div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
        <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Tipografia & Forma</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fonte</label>
            <select value={form.fontFamily} onChange={(e) => setForm({ ...form, fontFamily: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
              {['Inter', 'Roboto', 'Poppins', 'Open Sans', 'Montserrat', 'Raleway'].map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Arredondamento</label>
            <select value={form.borderRadius} onChange={(e) => setForm({ ...form, borderRadius: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
              {['0px', '4px', '8px', '12px', '16px', '24px'].map((r) => <option key={r} value={r}>{r === '0px' ? 'Sem arredondamento' : r}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
        <h2 className="font-semibold text-slate-900 dark:text-white text-sm">SEO</h2>
        <div className="grid grid-cols-1 gap-4">
          {field('metaTitle', 'Título da página')}
          {field('metaDescription', 'Descrição meta')}
        </div>
      </div>

      {updateMutation.isSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2 text-sm">
          ✓ Configurações salvas com sucesso!
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => updateMutation.mutate(form)}
          disabled={updateMutation.isPending}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-60"
        >
          {updateMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </div>
  );
}

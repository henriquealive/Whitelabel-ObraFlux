'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ProjectStatus } from '@obraflux/shared';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  ON_HOLD: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho', IN_PROGRESS: 'Em andamento', ON_HOLD: 'Pausado', COMPLETED: 'Concluído', CANCELLED: 'Cancelado',
};

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<any>({
    queryKey: ['projects', { search, status, page }],
    queryFn: () =>
      api.get(`/v1/projects?page=${page}&search=${search}&status=${status}`).then((r) => r.data.data ?? r.data),
  });

  const projects = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Obras</h1>
          <p className="text-slate-500 text-sm">Gerencie todos os seus projetos</p>
        </div>
        <Link
          href="/projects/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Nova Obra
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar obras..."
          className="flex-1 max-w-sm px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Carregando...</div>
        ) : projects.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500">Nenhuma obra encontrada.</p>
            <Link href="/projects/new" className="text-blue-600 text-sm hover:underline mt-2 inline-block">Criar primeira obra</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Obra</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Progresso</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Valor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Prazo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {projects.map((p: Record<string, unknown>) => (
                <tr key={p.id as string} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/projects/${p.id as string}`} className="font-medium text-slate-900 dark:text-white hover:text-blue-600">
                      {p.name as string}
                    </Link>
                    <p className="text-xs text-slate-400">{p.city as string}{p.state ? `, ${p.state as string}` : ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status as string] || ''}`}>
                      {STATUS_LABELS[p.status as string] ?? p.status as string}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden max-w-[80px]">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.progressPct as number}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{p.progressPct as number}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {p.contractValue ? formatCurrency(p.contractValue as number) : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {p.estimatedEnd ? formatDate(p.estimatedEnd as string) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500">
              {meta.total} obra{meta.total !== 1 ? 's' : ''} · página {meta.page}/{meta.totalPages}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!meta.hasPrev} className="px-3 py-1 text-xs border border-slate-300 rounded disabled:opacity-40">Anterior</button>
              <button onClick={() => setPage(p => p + 1)} disabled={!meta.hasNext} className="px-3 py-1 text-xs border border-slate-300 rounded disabled:opacity-40">Próximo</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ProjectStatus } from '@obraflux/shared';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-500/15 text-slate-400',
  IN_PROGRESS: 'bg-blue-500/15 text-blue-400',
  ON_HOLD: 'bg-amber-500/15 text-amber-400',
  COMPLETED: 'bg-green-500/15 text-green-400',
  CANCELLED: 'bg-red-500/15 text-red-400',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho', IN_PROGRESS: 'Em andamento', ON_HOLD: 'Pausado', COMPLETED: 'Concluído', CANCELLED: 'Cancelado',
};

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery<any>({
    queryKey: ['projects', { search, status, page }],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      return api.get(`/v1/projects?${params.toString()}`).then((r) => r.data.data ?? r.data);
    },
  });

  const projects = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Obras</h1>
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
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar obras..."
          className="flex-1 min-w-[160px] max-w-sm px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Carregando...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-400 text-sm">Erro ao carregar obras. Tente novamente.</div>
        ) : projects.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500">Nenhuma obra encontrada.</p>
            <Link href="/projects/new" className="text-blue-400 text-sm hover:underline mt-2 inline-block">Criar primeira obra</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-slate-900 border-b border-slate-700">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Obra</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Progresso</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Valor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Prazo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {projects.map((p: Record<string, unknown>) => (
                  <tr key={p.id as string} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/projects/${p.id as string}`} className="font-medium text-slate-200 hover:text-blue-400 transition-colors">
                        {p.name as string}
                      </Link>
                      <p className="text-xs text-slate-500">{p.city as string}{p.state ? `, ${p.state as string}` : ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status as string] || ''}`}>
                        {STATUS_LABELS[p.status as string] ?? p.status as string}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden max-w-[80px]">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.progressPct as number}%` }} />
                        </div>
                        <span className="text-xs text-slate-400">{p.progressPct as number}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 hidden md:table-cell">
                      {p.contractValue ? formatCurrency(p.contractValue as number) : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">
                      {p.estimatedEnd ? formatDate(p.estimatedEnd as string) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
            <p className="text-xs text-slate-500">
              {meta.total} obra{meta.total !== 1 ? 's' : ''} · página {meta.page}/{meta.totalPages}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!meta.hasPrev} className="px-3 py-1 text-xs border border-slate-700 text-slate-400 rounded hover:bg-slate-700 disabled:opacity-40">Anterior</button>
              <button onClick={() => setPage(p => p + 1)} disabled={!meta.hasNext} className="px-3 py-1 text-xs border border-slate-700 text-slate-400 rounded hover:bg-slate-700 disabled:opacity-40">Próximo</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

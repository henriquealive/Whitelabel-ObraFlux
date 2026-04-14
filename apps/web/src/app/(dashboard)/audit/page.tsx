'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function AuditPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page],
    queryFn: () => api.get(`/v1/audit?page=${page}&limit=30`).then((r) => r.data.data ?? r.data),
  });

  const logs = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Auditoria</h1>
        <p className="text-slate-500 text-sm">Rastreabilidade completa de ações</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="text-center text-slate-400 py-8">Carregando...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ação</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Entidade</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Usuário</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">IP</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Data/Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {logs.map((log: Record<string, unknown>) => (
                <tr key={log.id as string} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {log.action as string}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{log.entity as string} {log.entityId ? `#${(log.entityId as string).slice(0, 8)}` : ''}</td>
                  <td className="px-4 py-3 text-slate-500">{(log.user as Record<string, unknown>)?.name as string ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs font-mono">{log.ip as string ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(log.createdAt as string, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500">{meta.total} registros · página {meta.page}/{meta.totalPages}</p>
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

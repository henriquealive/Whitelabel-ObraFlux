'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-700', IN_PROGRESS: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700', CLOSED: 'bg-slate-100 text-slate-600',
};
const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Aberto', IN_PROGRESS: 'Em andamento', RESOLVED: 'Resolvido', CLOSED: 'Fechado',
};
const PRIORITY_LABELS = ['', 'Baixa', 'Média', 'Alta', 'Crítica'];

export default function MaintenancePage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<any>({
    queryKey: ['maintenance', id],
    queryFn: () => api.get(`/v1/projects/${id}/maintenance`).then((r) => r.data.data ?? r.data),
  });

  const logs = data?.data ?? [];

  const updateMutation = useMutation({
    mutationFn: ({ logId, status }: { logId: string; status: string }) =>
      api.patch(`/v1/projects/${id}/maintenance/${logId}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['maintenance', id] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Pós-Obra & Manutenção</h2>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
          + Novo registro
        </button>
      </div>

      {isLoading ? (
        <div className="text-center text-slate-400 py-8">Carregando...</div>
      ) : logs.length === 0 ? (
        <div className="text-center text-slate-400 py-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          Nenhum registro de manutenção.
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log: Record<string, unknown>) => (
            <div key={log.id as string} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[log.status as string] || ''}`}>
                      {STATUS_LABELS[log.status as string] ?? log.status as string}
                    </span>
                    <span className="text-xs text-slate-400">P{log.priority as number}: {PRIORITY_LABELS[log.priority as number] ?? 'N/A'}</span>
                  </div>
                  <h3 className="font-medium text-slate-900 dark:text-white">{log.title as string}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{log.description as string}</p>
                  <p className="text-xs text-slate-400 mt-2">Aberto em {formatDate(log.createdAt as string)}</p>
                </div>
                {log.status !== 'CLOSED' && (
                  <select
                    value={log.status as string}
                    onChange={(e) => updateMutation.mutate({ logId: log.id as string, status: e.target.value })}
                    className="text-xs border border-slate-300 rounded-lg px-2 py-1 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  >
                    {Object.entries(STATUS_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

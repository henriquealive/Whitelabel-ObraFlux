'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const TYPE_ICONS: Record<string, string> = {
  PHOTO: '📷', VIDEO: '🎥', REPORT: '📄', NOTE: '📝', MILESTONE: '🏆',
};

const TYPE_LABELS: Record<string, string> = {
  PHOTO: 'Foto', VIDEO: 'Vídeo', REPORT: 'Relatório', NOTE: 'Nota', MILESTONE: 'Marco',
};

export default function TimelinePage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'NOTE', title: '', content: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['timeline', id],
    queryFn: () => api.get(`/v1/projects/${id}/timeline?limit=50`).then((r) => r.data.data ?? r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post(`/v1/projects/${id}/timeline`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', id] });
      setShowForm(false);
      setForm({ type: 'NOTE', title: '', content: '' });
    },
  });

  const entries = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Timeline da obra</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
        >
          + Adicionar entrada
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              >
                {Object.entries(TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Título</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                placeholder="Título da entrada"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Descrição</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={3}
              className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              placeholder="Descreva o evento..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-slate-300 rounded-lg">Cancelar</button>
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg disabled:opacity-60"
            >
              {createMutation.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center text-slate-400 py-8">Carregando timeline...</div>
      ) : entries.length === 0 ? (
        <div className="text-center text-slate-400 py-8">Nenhuma entrada na timeline ainda.</div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
          <div className="space-y-4">
            {entries.map((entry: Record<string, unknown>) => (
              <div key={entry.id as string} className="flex gap-4 pl-10 relative">
                <div className="absolute left-2 top-2 w-5 h-5 rounded-full bg-white dark:bg-slate-800 border-2 border-blue-500 flex items-center justify-center text-xs">
                  {TYPE_ICONS[entry.type as string] ?? '📌'}
                </div>
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {Boolean(entry.title) && <p className="font-medium text-slate-900 dark:text-white text-sm">{entry.title as string}</p>}
                      {Boolean(entry.content) && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{entry.content as string}</p>}
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{formatDate(entry.recordedAt as string)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                      {TYPE_LABELS[entry.type as string] ?? entry.type as string}
                    </span>
                    {Boolean(entry.author) && (
                      <span className="text-xs text-slate-400">por {(entry.author as Record<string, unknown>).name as string}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

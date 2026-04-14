'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8',
  IN_PROGRESS: '#3b82f6',
  ON_HOLD: '#f59e0b',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  IN_PROGRESS: 'Em andamento',
  ON_HOLD: 'Pausado',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
};

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: statsData } = useQuery({
    queryKey: ['project-stats'],
    queryFn: () => api.get('/v1/projects/stats').then((r) => r.data.data ?? r.data),
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects', { limit: 5 }],
    queryFn: () => api.get('/v1/projects?limit=5&sortBy=updatedAt').then((r) => r.data.data ?? r.data),
  });

  const stats = statsData ?? {};
  const projects = projectsData?.data ?? [];
  const statusChart = Object.entries(stats.byStatus ?? {}).map(([status, count]) => ({
    name: STATUS_LABELS[status] ?? status,
    count: count as number,
    status,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Olá, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">Visão geral dos seus projetos</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total de obras" value={Object.values(stats.byStatus ?? {}).reduce((a: number, b: number) => a + (b as number), 0)} />
        <StatCard label="Em andamento" value={(stats.byStatus?.IN_PROGRESS ?? 0) as number} highlight />
        <StatCard label="Valor total contratado" value={formatCurrency(stats.totalContractValue ?? 0)} />
        <StatCard label="Progresso médio" value={`${stats.avgProgress ?? 0}%`} />
      </div>

      {/* Charts + recent projects */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Bar chart by status */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Obras por status</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {statusChart.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent projects */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Obras recentes</h2>
          <div className="space-y-3">
            {projects.length === 0 && <p className="text-slate-400 text-sm">Nenhuma obra cadastrada.</p>}
            {projects.map((p: Record<string, unknown>) => (
              <div key={p.id as string} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{p.name as string}</p>
                  <p className="text-xs text-slate-400">{p.city as string}{p.state ? `, ${p.state as string}` : ''}</p>
                </div>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${STATUS_COLORS[p.status as string]}20`,
                    color: STATUS_COLORS[p.status as string],
                  }}
                >
                  {STATUS_LABELS[p.status as string] ?? p.status as string}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 ${highlight ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
      <p className={`text-xs font-medium uppercase tracking-wide ${highlight ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>{label}</p>
      <p className={`text-2xl font-bold mt-1 ${highlight ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{value}</p>
    </div>
  );
}

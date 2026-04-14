'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

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

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: project, isLoading } = useQuery<any>({
    queryKey: ['project', id],
    queryFn: () => api.get(`/v1/projects/${id}`).then((r) => r.data.data ?? r.data),
  });

  if (isLoading) return <div className="p-8 text-center text-slate-400">Carregando...</div>;
  if (!project) return <div className="p-8 text-center text-slate-400">Obra não encontrada.</div>;

  const tabs = [
    { label: 'Timeline', href: `/projects/${id}/timeline` },
    { label: 'Financeiro', href: `/projects/${id}/financial` },
    { label: 'Arquivos', href: `/projects/${id}/files` },
    { label: 'Monitoramento', href: `/projects/${id}/monitoring` },
    { label: 'Manutenção', href: `/projects/${id}/maintenance` },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/projects" className="hover:text-blue-600">Obras</Link>
            <span>/</span>
            <span>{project.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{project.name}</h1>
          {project.city && <p className="text-slate-500 text-sm mt-1">{project.city}{project.state ? `, ${project.state}` : ''}</p>}
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[project.status] || ''}`}>
          {STATUS_LABELS[project.status] ?? project.status}
        </span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoCard label="Progresso" value={`${project.progressPct}%`}>
          <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${project.progressPct}%` }} />
          </div>
        </InfoCard>
        <InfoCard label="Valor contratado" value={project.contractValue ? formatCurrency(project.contractValue) : '—'} />
        <InfoCard label="Início" value={project.startDate ? formatDate(project.startDate) : '—'} />
        <InfoCard label="Previsão" value={project.estimatedEnd ? formatDate(project.estimatedEnd) : '—'} />
      </div>

      {/* Description */}
      {project.description && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Descrição</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">{project.description}</p>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex gap-0 -mb-px">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-blue-600 hover:border-b-2 hover:border-blue-600 border-b-2 border-transparent transition-colors"
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Members */}
      {project.members?.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Equipe</h2>
          <div className="flex flex-wrap gap-3">
            {project.members.map((m: Record<string, unknown>) => {
              const user = m.user as Record<string, unknown>;
              return (
                <div key={m.id as string} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 rounded-lg px-3 py-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">
                    {(user.name as string).charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-800 dark:text-white">{user.name as string}</p>
                    <p className="text-xs text-slate-400">{m.role as string}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{label}</p>
      <p className="text-lg font-semibold text-slate-900 dark:text-white mt-1">{value}</p>
      {children}
    </div>
  );
}

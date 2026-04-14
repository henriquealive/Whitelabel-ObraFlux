'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatDate } from '@/lib/utils';

const ROLES = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'PROJECT_MANAGER', label: 'Gerente de Projetos' },
  { value: 'COLLABORATOR', label: 'Colaborador' },
  { value: 'CLIENT', label: 'Cliente' },
];

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
}

export default function TeamPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('COLLABORATOR');

  const { data: membersData } = useQuery<any>({
    queryKey: ['team-members'],
    queryFn: () => api.get('/v1/users').then((r) => r.data.data ?? r.data),
  });

  const { data: invitesData } = useQuery<any>({
    queryKey: ['invitations'],
    queryFn: () => api.get('/v1/invitations').then((r) => r.data.data ?? r.data),
  });

  const members: Member[] = membersData?.data ?? membersData ?? [];
  const invitations: Invitation[] = invitesData?.data ?? invitesData ?? [];

  const inviteMutation = useMutation({
    mutationFn: () => api.post('/v1/invitations', { email: inviteEmail, role: inviteRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      setInviteEmail('');
    },
  });

  const cancelInviteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/invitations/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invitations'] }),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.patch(`/v1/users/${id}/role`, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team-members'] }),
  });

  const removeUserMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team-members'] }),
  });

  const getRoleBadge = (role: string) => {
    const map: Record<string, string> = {
      SUPER_ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      ADMIN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      PROJECT_MANAGER: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      COLLABORATOR: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
      CLIENT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    };
    return map[role] ?? map.COLLABORATOR;
  };

  const getRoleLabel = (role: string) =>
    ROLES.find((r) => r.value === role)?.label ?? role;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Equipe</h1>
        <p className="text-slate-500 text-sm">Gerencie membros e convites</p>
      </div>

      {/* Invite form */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Convidar membro</h2>
        <div className="flex gap-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email@empresa.com"
            className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <button
            onClick={() => inviteMutation.mutate()}
            disabled={!inviteEmail || inviteMutation.isPending}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
          >
            {inviteMutation.isPending ? 'Enviando...' : 'Enviar convite'}
          </button>
        </div>
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Convites pendentes
              <span className="ml-2 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">
                {invitations.length}
              </span>
            </h2>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {invitations.map((inv) => (
                <tr key={inv.id} className="px-6">
                  <td className="px-6 py-3 text-slate-700 dark:text-slate-300">{inv.email}</td>
                  <td className="px-6 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadge(inv.role)}`}>
                      {getRoleLabel(inv.role)}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-400 text-xs">
                    Expira {formatDate(inv.expiresAt, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => cancelInviteMutation.mutate(inv.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Cancelar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Members */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Membros da equipe
            <span className="ml-2 text-xs text-slate-500">{members.length} pessoas</span>
          </h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-4 px-6 py-4">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {member.avatarUrl ? (
                  <img src={member.avatarUrl} alt={member.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  member.name?.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {member.name}
                  </span>
                  {member.id === user?.id && (
                    <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded">
                      Você
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">{member.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadge(member.role)}`}>
                  {getRoleLabel(member.role)}
                </span>
                {member.lastLoginAt && (
                  <span className="text-xs text-slate-400 hidden sm:block">
                    {formatDate(member.lastLoginAt, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                )}
                {member.id !== user?.id && (
                  <div className="flex gap-2">
                    <select
                      value={member.role}
                      onChange={(e) => updateRoleMutation.mutate({ id: member.id, role: e.target.value })}
                      className="text-xs border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-900"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        if (confirm(`Remover ${member.name} da equipe?`)) {
                          removeUserMutation.mutate(member.id);
                        }
                      }}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-1 border border-red-200 dark:border-red-800 rounded"
                    >
                      Remover
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function SecurityPage() {
  const user = useAuthStore((s) => s.user);

  // Password change
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');

  const changePwMutation = useMutation({
    mutationFn: () =>
      api.patch('/v1/auth/change-password', {
        currentPassword: pwForm.current,
        newPassword: pwForm.next,
      }),
    onSuccess: () => {
      setPwMsg('Senha alterada com sucesso.');
      setPwForm({ current: '', next: '', confirm: '' });
    },
    onError: () => setPwMsg('Senha atual incorreta ou erro inesperado.'),
  });

  // 2FA setup
  const [twoFaStep, setTwoFaStep] = useState<'idle' | 'setup' | 'confirm'>('idle');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [totp, setTotp] = useState('');
  const [twoFaMsg, setTwoFaMsg] = useState('');

  const setup2faMutation = useMutation({
    mutationFn: () => api.post('/v1/auth/2fa/setup'),
    onSuccess: (res) => {
      setQrCode(res.data.qrCode);
      setSecret(res.data.secret);
      setTwoFaStep('setup');
    },
  });

  const confirm2faMutation = useMutation({
    mutationFn: () => api.post('/v1/auth/2fa/confirm', { token: totp }),
    onSuccess: () => {
      setTwoFaMsg('Autenticação de dois fatores ativada com sucesso!');
      setTwoFaStep('idle');
    },
    onError: () => setTwoFaMsg('Código inválido. Tente novamente.'),
  });

  const disable2faMutation = useMutation({
    mutationFn: (token: string) => api.delete('/v1/auth/2fa', { data: { token } }),
    onSuccess: () => setTwoFaMsg('Autenticação de dois fatores desativada.'),
  });

  const [disable2faToken, setDisable2faToken] = useState('');

  const handleChangePw = () => {
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg('As senhas não coincidem.');
      return;
    }
    if (pwForm.next.length < 8) {
      setPwMsg('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }
    setPwMsg('');
    changePwMutation.mutate();
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Segurança</h1>
        <p className="text-slate-500 text-sm">Gerencie sua senha e autenticação de dois fatores</p>
      </div>

      {/* Change password */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Alterar senha</h2>
        <p className="text-sm text-slate-500 mb-4">Use uma senha forte com pelo menos 8 caracteres</p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Senha atual
            </label>
            <input
              type="password"
              value={pwForm.current}
              onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Nova senha
            </label>
            <input
              type="password"
              value={pwForm.next}
              onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Confirmar nova senha
            </label>
            <input
              type="password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900"
            />
          </div>
          {pwMsg && (
            <p className={`text-xs ${pwMsg.includes('sucesso') ? 'text-green-600' : 'text-red-500'}`}>
              {pwMsg}
            </p>
          )}
          <button
            onClick={handleChangePw}
            disabled={!pwForm.current || !pwForm.next || changePwMutation.isPending}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {changePwMutation.isPending ? 'Salvando...' : 'Alterar senha'}
          </button>
        </div>
      </div>

      {/* 2FA */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Autenticação de dois fatores
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Adicione uma camada extra de segurança usando um app autenticador (Google Authenticator, Authy)
            </p>
          </div>
          <div className={`text-xs px-2 py-1 rounded-full font-medium ${
            user?.twoFactorEnabled
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-700'
          }`}>
            {user?.twoFactorEnabled ? 'Ativado' : 'Desativado'}
          </div>
        </div>

        {twoFaMsg && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            twoFaMsg.includes('sucesso') || twoFaMsg.includes('ativada')
              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {twoFaMsg}
          </div>
        )}

        {!user?.twoFactorEnabled ? (
          <>
            {twoFaStep === 'idle' && (
              <button
                onClick={() => setup2faMutation.mutate()}
                disabled={setup2faMutation.isPending}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {setup2faMutation.isPending ? 'Gerando...' : 'Configurar 2FA'}
              </button>
            )}

            {twoFaStep === 'setup' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    1. Escaneie o QR Code com seu app autenticador
                  </p>
                  {qrCode && (
                    <img src={qrCode} alt="QR Code 2FA" className="w-48 h-48 mx-auto border border-slate-200 dark:border-slate-700 rounded-lg p-2 bg-white" />
                  )}
                  <p className="text-xs text-slate-400 mt-3 text-center">
                    Ou insira manualmente: <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs font-mono">{secret}</code>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    2. Digite o código de 6 dígitos gerado pelo app
                  </p>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={totp}
                      onChange={(e) => setTotp(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 w-36 font-mono text-center tracking-widest"
                    />
                    <button
                      onClick={() => confirm2faMutation.mutate()}
                      disabled={totp.length !== 6 || confirm2faMutation.isPending}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      Verificar e ativar
                    </button>
                    <button
                      onClick={() => setTwoFaStep('idle')}
                      className="px-4 py-2 rounded-lg text-sm border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Para desativar o 2FA, confirme sua identidade com um código do autenticador.
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={disable2faToken}
                onChange={(e) => setDisable2faToken(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 w-36 font-mono text-center tracking-widest"
              />
              <button
                onClick={() => disable2faMutation.mutate(disable2faToken)}
                disabled={disable2faToken.length !== 6 || disable2faMutation.isPending}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                Desativar 2FA
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Active sessions placeholder */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Sessões ativas</h2>
        <p className="text-sm text-slate-500 mb-4">Dispositivos com acesso à sua conta</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Esta sessão</p>
                <p className="text-xs text-slate-500">Agora mesmo · Sessão atual</p>
              </div>
            </div>
            <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
              Ativa
            </span>
          </div>
        </div>
        <button
          onClick={() => api.delete('/v1/auth/sessions/all')}
          className="mt-4 text-sm text-red-500 hover:text-red-700"
        >
          Encerrar todas as outras sessões
        </button>
      </div>
    </div>
  );
}

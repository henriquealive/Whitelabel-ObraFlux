'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useTenant } from '@/providers/TenantProvider';

export default function Verify2FAPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preAuthToken = searchParams.get('token') ?? '';
  const { branding, tenant } = useTenant();
  const setTokens = useAuthStore((s) => s.setTokens);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const brandColor = branding?.primaryColor ?? '#2563eb';

  const verifyMutation = useMutation({
    mutationFn: () =>
      api.post('/v1/auth/2fa/verify', { token: preAuthToken, totpToken: code }),
    onSuccess: async (res) => {
      const { accessToken, refreshToken, expiresIn } = res.data;
      setTokens({ accessToken, refreshToken, expiresIn });
      await fetchProfile();
      router.push('/dashboard');
    },
    onError: () => {
      setError('Código inválido. Verifique seu app autenticador e tente novamente.');
      setCode('');
    },
  });

  const handleChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    setError('');
    if (digits.length === 6) {
      // auto-submit when complete
      setTimeout(() => verifyMutation.mutate(), 0);
    }
  };

  if (!preAuthToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Token inválido ou ausente.</p>
          <Link href="/login" className="text-blue-600 underline text-sm">Voltar ao login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            {branding?.logoUrl ? (
              <img src={branding.logoUrl} alt={tenant?.name ?? ''} className="h-10 object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: brandColor }}>
                {(tenant?.name ?? 'O').charAt(0)}
              </div>
            )}
          </div>

          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              Verificação em dois fatores
            </h1>
            <p className="text-sm text-slate-500">
              Abra seu app autenticador e insira o código de 6 dígitos
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="000000"
                autoFocus
                className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-4 text-center text-3xl font-mono tracking-[0.5em] bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': brandColor } as React.CSSProperties}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-xs text-red-600 dark:text-red-400 text-center">{error}</p>
              </div>
            )}

            <button
              onClick={() => verifyMutation.mutate()}
              disabled={code.length !== 6 || verifyMutation.isPending}
              className="w-full py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-colors"
              style={{ backgroundColor: brandColor }}
            >
              {verifyMutation.isPending ? 'Verificando...' : 'Verificar'}
            </button>

            <div className="text-center text-xs text-slate-400">
              <p>Não está conseguindo acessar seu app?</p>
              <button className="text-blue-500 hover:underline mt-0.5">
                Usar código de backup
              </button>
            </div>

            <Link
              href="/login"
              className="block text-center text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              ← Voltar ao login
            </Link>
          </div>
        </div>

        {tenant && (
          <p className="text-center text-xs text-slate-400 mt-4">{tenant.name}</p>
        )}

      </div>
    </div>
  );
}

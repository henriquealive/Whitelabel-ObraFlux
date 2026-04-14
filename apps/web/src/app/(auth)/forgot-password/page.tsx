'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useTenant } from '@/providers/TenantProvider';

export default function ForgotPasswordPage() {
  const { branding, tenant } = useTenant();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const mutation = useMutation({
    mutationFn: () => api.post('/v1/auth/forgot-password', { email }),
    onSuccess: () => setSent(true),
  });

  const brandColor = branding?.primaryColor ?? '#2563eb';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-md">
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

          {!sent ? (
            <>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-1">
                Recuperar senha
              </h1>
              <p className="text-sm text-slate-500 text-center mb-6">
                Insira seu e-mail e enviaremos um link para redefinir sua senha
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && mutation.mutate()}
                    placeholder="seu@email.com"
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': brandColor } as React.CSSProperties}
                  />
                </div>

                {mutation.isError && (
                  <p className="text-xs text-red-500">
                    Ocorreu um erro. Tente novamente.
                  </p>
                )}

                <button
                  onClick={() => mutation.mutate()}
                  disabled={!email || mutation.isPending}
                  className="w-full py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: brandColor }}
                >
                  {mutation.isPending ? 'Enviando...' : 'Enviar link de recuperação'}
                </button>

                <Link
                  href="/login"
                  className="block text-center text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  ← Voltar ao login
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">E-mail enviado!</h2>
              <p className="text-sm text-slate-500 mb-6">
                Se uma conta com <strong>{email}</strong> existir, você receberá um e-mail com instruções para redefinir sua senha.
              </p>
              <p className="text-xs text-slate-400 mb-4">
                Verifique também sua pasta de spam.
              </p>
              <Link
                href="/login"
                className="text-sm font-medium hover:underline"
                style={{ color: brandColor }}
              >
                Voltar ao login
              </Link>
            </div>
          )}
        </div>

        {tenant && (
          <p className="text-center text-xs text-slate-400 mt-4">
            {tenant.name}
          </p>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useTenant } from '@/providers/TenantProvider';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();
  const { branding, tenant } = useTenant();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/v1/auth/login', data);
      const { user, tokens, requiresTwoFactor } = res.data.data ?? res.data;
      if (requiresTwoFactor) {
        router.push(`/verify-2fa?userId=${user.id}`);
        return;
      }
      setUser(user);
      setTokens(tokens);
      router.push('/dashboard');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message || 'Falha ao entrar. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const companyName = tenant?.branding?.companyName || branding?.companyName || 'ObraFlux';
  const primaryColor = branding?.primaryColor || '#2563EB';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8">
      <div className="flex flex-col items-center mb-8">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg mb-4"
          style={{ backgroundColor: primaryColor }}
        >
          {companyName.charAt(0)}
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{companyName}</h1>
        <p className="text-slate-500 text-sm mt-1">Entre na sua conta</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
            placeholder="seu@email.com"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha</label>
          <input
            {...register('password')}
            type="password"
            autoComplete="current-password"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
            placeholder="••••••••"
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">Esqueci minha senha</Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 text-white rounded-lg font-medium text-sm transition-opacity disabled:opacity-60"
          style={{ backgroundColor: primaryColor }}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Não tem conta?{' '}
        <Link href="/register" className="text-blue-600 hover:underline font-medium">Criar conta</Link>
      </p>
    </div>
  );
}

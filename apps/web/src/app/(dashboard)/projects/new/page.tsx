'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  startDate: z.string().optional(),
  estimatedEnd: z.string().optional(),
  contractValue: z.coerce.number().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewProjectPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      const res = await api.post('/v1/projects', data);
      const project = res.data.data ?? res.data;
      qc.invalidateQueries({ queryKey: ['projects'] });
      router.push(`/projects/${project.id as string}`);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message || 'Erro ao criar obra.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <Link href="/projects" className="hover:text-blue-600">Obras</Link>
          <span>/</span>
          <span>Nova obra</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nova Obra</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
        <Field label="Nome da obra *" error={errors.name?.message}>
          <input {...register('name')} placeholder="Ex: Residencial Jardim Paulista" className={inputCls} />
        </Field>

        <Field label="Descrição" error={errors.description?.message}>
          <textarea {...register('description')} rows={3} placeholder="Descrição detalhada..." className={inputCls} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Cidade" error={errors.city?.message}>
            <input {...register('city')} placeholder="São Paulo" className={inputCls} />
          </Field>
          <Field label="Estado" error={errors.state?.message}>
            <input {...register('state')} placeholder="SP" className={inputCls} />
          </Field>
        </div>

        <Field label="Endereço" error={errors.address?.message}>
          <input {...register('address')} placeholder="Rua, número, bairro" className={inputCls} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Data de início" error={errors.startDate?.message}>
            <input {...register('startDate')} type="date" className={inputCls} />
          </Field>
          <Field label="Previsão de entrega" error={errors.estimatedEnd?.message}>
            <input {...register('estimatedEnd')} type="date" className={inputCls} />
          </Field>
        </div>

        <Field label="Valor contratado (R$)" error={errors.contractValue?.message}>
          <input {...register('contractValue')} type="number" step="0.01" placeholder="0,00" className={inputCls} />
        </Field>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/projects" className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Cancelar</Link>
          <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-60">
            {isSubmitting ? 'Criando...' : 'Criar obra'}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white';

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

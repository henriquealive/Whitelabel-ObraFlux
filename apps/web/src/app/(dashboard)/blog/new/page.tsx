'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function NewBlogPostPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    tags: '',
    status: 'DRAFT',
    coverImageUrl: '',
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/v1/blog', {
        title: form.title,
        slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        excerpt: form.excerpt || undefined,
        content: form.content,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        status: form.status,
        coverImageUrl: form.coverImageUrl || undefined,
      }),
    onSuccess: (res) => {
      router.push(`/blog/${res.data.id}`);
    },
  });

  const autoSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          ← Voltar
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nova publicação</h1>
          <p className="text-slate-500 text-sm">Blog / Feed do escritório</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Título *
          </label>
          <input
            value={form.title}
            onChange={(e) => {
              const t = e.target.value;
              setForm((f) => ({ ...f, title: t, slug: autoSlug(t) }));
            }}
            placeholder="Título da publicação"
            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Slug (URL)
          </label>
          <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
            <span className="px-3 py-2 text-sm text-slate-400 bg-slate-50 dark:bg-slate-900 border-r border-slate-300 dark:border-slate-600 select-none">
              /blog/
            </span>
            <input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="meu-post"
              className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            URL da imagem de capa (opcional)
          </label>
          <input
            value={form.coverImageUrl}
            onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
            placeholder="https://..."
            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
          {form.coverImageUrl && (
            <img
              src={form.coverImageUrl}
              alt="Capa"
              className="mt-2 h-32 w-full object-cover rounded-lg border border-slate-200 dark:border-slate-700"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Resumo / Excerpt (opcional)
          </label>
          <textarea
            value={form.excerpt}
            onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
            rows={2}
            placeholder="Uma breve descrição do post..."
            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Conteúdo * <span className="text-slate-400">(Markdown suportado)</span>
          </label>
          <textarea
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            rows={16}
            placeholder="Escreva o conteúdo aqui..."
            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white resize-y font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Tags (separadas por vírgula)
          </label>
          <input
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            placeholder="arquitetura, design, obra"
            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="radio"
                value="DRAFT"
                checked={form.status === 'DRAFT'}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              />
              Rascunho
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="radio"
                value="PUBLISHED"
                checked={form.status === 'PUBLISHED'}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              />
              Publicar agora
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="radio"
                value="ARCHIVED"
                checked={form.status === 'ARCHIVED'}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              />
              Arquivar
            </label>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded-lg text-sm border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              onClick={() => createMutation.mutate()}
              disabled={!form.title || !form.content || createMutation.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Publicando...' : form.status === 'PUBLISHED' ? 'Publicar' : 'Salvar rascunho'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

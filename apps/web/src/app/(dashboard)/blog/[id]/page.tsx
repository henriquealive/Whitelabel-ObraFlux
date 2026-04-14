'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  tags: string[];
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  coverImageUrl: string | null;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string; avatarUrl: string | null };
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',
};

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PUBLISHED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  ARCHIVED: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
};

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<BlogPost>>({});

  const { data: post, isLoading } = useQuery<any>({
    queryKey: ['blog-post', id],
    queryFn: () => api.get(`/v1/blog/${id}`).then((r) => r.data),
    select: (data) => data.data ?? data,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<BlogPost>) => api.patch(`/v1/blog/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-post', id] });
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/v1/blog/${id}`),
    onSuccess: () => router.push('/blog'),
  });

  if (isLoading) {
    return <div className="text-center py-12 text-slate-400">Carregando...</div>;
  }

  if (!post) {
    return (
      <div className="text-center py-12 text-slate-400">
        Post não encontrado. <button onClick={() => router.push('/blog')} className="text-blue-500 underline">Voltar</button>
      </div>
    );
  }

  if (editing) {
    const editData = { ...post, ...form };
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            ← Cancelar edição
          </button>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Título</label>
            <input
              value={editData.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Resumo</label>
            <textarea
              value={editData.excerpt ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              rows={2}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Conteúdo <span className="text-slate-400">(Markdown)</span>
            </label>
            <textarea
              value={editData.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={16}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white resize-y font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Tags</label>
            <input
              value={Array.isArray(editData.tags) ? editData.tags.join(', ') : editData.tags ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) }))}
              placeholder="tag1, tag2"
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
            <select
              value={editData.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as BlogPost['status'] }))}
              className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900"
            >
              <option value="DRAFT">Rascunho</option>
              <option value="PUBLISHED">Publicado</option>
              <option value="ARCHIVED">Arquivado</option>
            </select>
            <button
              onClick={() => updateMutation.mutate(form)}
              disabled={updateMutation.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/blog')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm">
          ← Blog
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => { setForm({}); setEditing(true); }}
            className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Editar
          </button>
          <button
            onClick={() => { if (confirm('Excluir este post?')) deleteMutation.mutate(); }}
            className="px-3 py-1.5 text-sm border border-red-300 dark:border-red-700 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Excluir
          </button>
        </div>
      </div>

      <article className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {post.coverImageUrl && (
          <img
            src={post.coverImageUrl}
            alt={post.title}
            className="w-full h-64 object-cover"
          />
        )}
        <div className="p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[post.status]}`}>
              {STATUS_LABELS[post.status]}
            </span>
            {(post.tags as string[]).map((tag: string) => (
              <span key={tag} className="text-xs bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
            <span className="ml-auto text-xs text-slate-400 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {post.viewCount} visualizações
            </span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{post.title}</h1>

          {post.excerpt && (
            <p className="text-slate-500 mb-4 text-base leading-relaxed">{post.excerpt}</p>
          )}

          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100 dark:border-slate-700">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {post.author?.avatarUrl ? (
                <img src={post.author.avatarUrl} alt={post.author.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                post.author?.name?.charAt(0)
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{post.author?.name}</p>
              <p className="text-xs text-slate-400">
                {post.publishedAt
                  ? formatDate(post.publishedAt, { day: '2-digit', month: 'long', year: 'numeric' })
                  : formatDate(post.createdAt, { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300">
            {post.content}
          </div>
        </div>
      </article>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = { DRAFT: 'Rascunho', PUBLISHED: 'Publicado', ARCHIVED: 'Arquivado' };
const STATUS_COLORS: Record<string, string> = { DRAFT: 'bg-slate-100 text-slate-600', PUBLISHED: 'bg-green-100 text-green-700', ARCHIVED: 'bg-amber-100 text-amber-700' };

export default function BlogPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery<any>({
    queryKey: ['blog', { search, status }],
    queryFn: () => api.get(`/v1/blog?search=${search}&status=${status}`).then((r) => r.data.data ?? r.data),
  });

  const posts = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Blog</h1>
          <p className="text-slate-500 text-sm">Conteúdo institucional e novidades</p>
        </div>
        <Link href="/blog/new" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
          + Novo post
        </Link>
      </div>

      <div className="flex gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar posts..."
          className="flex-1 max-w-sm px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
        >
          <option value="">Todos</option>
          {Object.entries(STATUS_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center text-slate-400 py-8">Carregando...</div>
      ) : posts.length === 0 ? (
        <div className="text-center text-slate-400 py-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          Nenhum post encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {posts.map((post: Record<string, unknown>) => (
            <Link key={post.id as string} href={`/blog/${post.id as string}`}
              className="block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow">
              {Boolean(post.coverImageUrl) && (
                <img src={post.coverImageUrl as string} alt="" className="w-full h-32 object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[post.status as string] || ''}`}>
                    {STATUS_LABELS[post.status as string] ?? post.status as string}
                  </span>
                  {(post.tags as string[])?.slice(0, 2).map((t) => (
                    <span key={t} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full text-xs">{t}</span>
                  ))}
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-2">{post.title as string}</h3>
                {Boolean(post.excerpt) && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{post.excerpt as string}</p>}
                <p className="text-xs text-slate-400 mt-2">
                  {post.publishedAt ? `Publicado em ${formatDate(post.publishedAt as string)}` : `Criado em ${formatDate(post.createdAt as string)}`}
                  {' · '}{post.readingTimeMins as number} min de leitura
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

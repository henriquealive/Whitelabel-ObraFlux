'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatBytes, formatDate } from '@/lib/utils';

const MIME_ICONS: Record<string, string> = {
  IMAGE: '🖼️', VIDEO: '🎬', DOCUMENT: '📄', SPREADSHEET: '📊', OTHER: '📁',
};

export default function FilesPage() {
  const { id } = useParams<{ id: string }>();

  const { data: foldersData } = useQuery<any>({
    queryKey: ['folders', id],
    queryFn: () => api.get(`/v1/files/folders?projectId=${id}`).then((r) => r.data.data ?? r.data),
  });

  const { data: filesData } = useQuery<any>({
    queryKey: ['files', id],
    queryFn: () => api.get(`/v1/files?projectId=${id}`).then((r) => r.data.data ?? r.data),
  });

  const folders = foldersData ?? [];
  const files = filesData?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Drive de Arquivos</h2>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
          + Upload
        </button>
      </div>

      {folders.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Pastas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {folders.map((folder: Record<string, unknown>) => (
              <div key={folder.id as string} className="flex flex-col items-center gap-1 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-400 transition-colors">
                <span className="text-2xl">📁</span>
                <span className="text-xs text-center text-slate-700 dark:text-slate-300 font-medium truncate w-full text-center">{folder.name as string}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Arquivos</h3>
        {files.length === 0 ? (
          <div className="text-center text-slate-400 py-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            Nenhum arquivo encontrado.
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Nome</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Tipo</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Tamanho</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Enviado em</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Por</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {files.map((file: Record<string, unknown>) => (
                  <tr key={file.id as string} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3 flex items-center gap-2">
                      <span>{MIME_ICONS[file.mimeCategory as string] ?? '📄'}</span>
                      <span className="font-medium text-slate-900 dark:text-white truncate max-w-xs">{file.originalName as string}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{file.mimeType as string}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{formatBytes(Number(file.sizeBytes))}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(file.createdAt as string)}</td>
                    <td className="px-4 py-3 text-slate-500">{(file.uploadedBy as Record<string, unknown>)?.name as string}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => api.get(`/v1/files/${file.id as string}/download`).then((r) => window.open((r.data.data ?? r.data).url, '_blank'))}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Baixar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

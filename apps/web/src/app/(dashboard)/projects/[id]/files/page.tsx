'use client';

import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatBytes, formatDate } from '@/lib/utils';

const MIME_ICONS: Record<string, string> = {
  IMAGE: '🖼️', VIDEO: '🎬', DOCUMENT: '📄', SPREADSHEET: '📊', OTHER: '📁',
};

export default function FilesPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  const { data: foldersData } = useQuery<any>({
    queryKey: ['folders', id],
    queryFn: () => api.get(`/v1/files/folders?projectId=${id}`).then((r) => r.data.data ?? r.data),
  });

  const { data: filesData } = useQuery<any>({
    queryKey: ['files', id, activeFolderId],
    queryFn: () => {
      const params = new URLSearchParams({ projectId: id });
      if (activeFolderId) params.set('folderId', activeFolderId);
      return api.get(`/v1/files?${params}`).then((r) => r.data.data ?? r.data);
    },
  });

  const folders = (foldersData ?? []) as Record<string, unknown>[];
  const files = (filesData?.data ?? filesData ?? []) as Record<string, unknown>[];

  const createFolderMutation = useMutation({
    mutationFn: (name: string) =>
      api.post('/v1/files/folders', { name, projectId: id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders', id] });
      setFolderName('');
      setShowFolderForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => api.delete(`/v1/files/${fileId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files', id] }),
  });

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploadError(null);
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const { data: payload } = await api.post('/v1/files/request-upload', {
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
          projectId: id,
          ...(activeFolderId ? { folderId: activeFolderId } : {}),
        });
        const { uploadUrl, fileId } = payload.data ?? payload;

        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
          body: file,
        });
        const etag = uploadRes.headers.get('ETag') ?? undefined;

        await api.post(`/v1/files/${fileId}/confirm-upload`, { etag });
      }
      qc.invalidateQueries({ queryKey: ['files', id] });
    } catch (e: any) {
      setUploadError(e?.response?.data?.message ?? 'Erro ao enviar arquivo.');
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-100">Drive de Arquivos</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFolderForm(true)}
            className="px-3 py-2 text-sm text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
          >
            + Pasta
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-60 transition-colors"
          >
            {uploading ? 'Enviando...' : '+ Upload'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      </div>

      {uploadError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-3 py-2 text-sm">
          {uploadError}
        </div>
      )}

      {/* New folder form */}
      {showFolderForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
          <input
            autoFocus
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Nome da pasta"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && folderName.trim()) createFolderMutation.mutate(folderName.trim());
              if (e.key === 'Escape') setShowFolderForm(false);
            }}
            className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => folderName.trim() && createFolderMutation.mutate(folderName.trim())}
            disabled={!folderName.trim() || createFolderMutation.isPending}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg disabled:opacity-60"
          >
            Criar
          </button>
          <button onClick={() => setShowFolderForm(false)} className="px-3 py-1.5 text-slate-400 hover:text-white text-sm">
            Cancelar
          </button>
        </div>
      )}

      {/* Drag-and-drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-blue-500 bg-blue-500/10 text-blue-400'
            : 'border-slate-700 hover:border-slate-600 text-slate-500 hover:text-slate-400'
        }`}
      >
        <svg className="w-8 h-8 mx-auto mb-2 opacity-60" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="text-sm font-medium">{uploading ? 'Enviando arquivos...' : 'Arraste arquivos aqui ou clique para selecionar'}</p>
        <p className="text-xs mt-1 opacity-60">Qualquer tipo de arquivo</p>
      </div>

      {/* Folders */}
      {folders.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Pastas</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {activeFolderId && (
              <button
                onClick={() => setActiveFolderId(null)}
                className="flex flex-col items-center gap-1 p-3 bg-slate-800 rounded-xl border border-slate-700 hover:border-slate-600 cursor-pointer transition-colors"
              >
                <span className="text-xl">↩</span>
                <span className="text-xs text-slate-400 font-medium">Voltar</span>
              </button>
            )}
            {folders.map((folder) => (
              <button
                key={folder.id as string}
                onClick={() => setActiveFolderId(folder.id as string)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border cursor-pointer transition-colors ${
                  activeFolderId === folder.id
                    ? 'bg-blue-600/15 border-blue-600/30'
                    : 'bg-slate-800 border-slate-700 hover:border-blue-500/50'
                }`}
              >
                <svg className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
                </svg>
                <span className="text-xs text-center text-slate-300 font-medium truncate w-full">{folder.name as string}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Files table */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Arquivos</h3>
        {files.length === 0 ? (
          <div className="text-center text-slate-500 py-10 bg-slate-800/50 rounded-xl border border-slate-700">
            Nenhum arquivo nesta {activeFolderId ? 'pasta' : 'obra'}.
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-slate-900 border-b border-slate-700">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nome</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Tipo</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Tamanho</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Enviado em</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Por</th>
                    <th className="px-4 py-3 w-20" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {files.map((file) => (
                    <tr key={file.id as string} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{MIME_ICONS[file.mimeCategory as string] ?? '📄'}</span>
                          <span className="font-medium text-slate-200 truncate max-w-[180px] sm:max-w-xs">{file.originalName as string}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs hidden sm:table-cell">{(file.mimeType as string)?.split('/')[1]?.toUpperCase()}</td>
                      <td className="px-4 py-3 text-right text-slate-500 text-xs hidden md:table-cell">{formatBytes(Number(file.sizeBytes))}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">{formatDate(file.createdAt as string)}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">{(file.uploadedBy as Record<string, unknown>)?.name as string}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => api.get(`/v1/files/${file.id as string}/download`).then((r) => window.open((r.data.data ?? r.data).url, '_blank'))}
                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            Baixar
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate(file.id as string)}
                            className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

export default function MonitoringPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const { data: cameras = [] } = useQuery<any[]>({
    queryKey: ['cameras', id],
    queryFn: () => api.get(`/v1/projects/${id}/monitoring/cameras`).then((r) => r.data.data ?? r.data),
  });

  const [selectedCamera, setSelectedCamera] = useState<Record<string, unknown> | null>(null);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Monitoramento ao vivo</h2>

      {cameras.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
          <p className="text-slate-400">Nenhuma câmera configurada para este projeto.</p>
          <p className="text-xs text-slate-300 mt-1">Configure câmeras RTSP nas configurações do projeto.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cameras.map((cam: Record<string, unknown>) => (
            <CameraCard
              key={cam.id as string}
              camera={cam}
              tenantId={user?.tenantId ?? ''}
              isSelected={selectedCamera?.id === cam.id}
              onSelect={() => setSelectedCamera(cam)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CameraCard({ camera, tenantId, isSelected, onSelect }: {
  camera: Record<string, unknown>;
  tenantId: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'live' | 'error'>('idle');

  const connect = () => {
    if (status === 'connecting' || status === 'live') return;
    setStatus('connecting');

    const socket = io(`${WS_URL}/monitoring`, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.emit('join-camera', { cameraId: camera.id, tenantId });

    socket.on('camera-ready', async () => {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      pcRef.current = pc;

      pc.ontrack = (e) => {
        if (videoRef.current && e.streams[0]) {
          videoRef.current.srcObject = e.streams[0];
          setStatus('live');
        }
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit('webrtc-ice-candidate', { to: 'server', candidate: e.candidate });
      };

      const offer = await pc.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: false });
      await pc.setLocalDescription(offer);
      socket.emit('webrtc-offer', { cameraId: camera.id, sdp: offer.sdp });
    });

    socket.on('webrtc-answer', async ({ sdp }: { sdp: string }) => {
      await pcRef.current?.setRemoteDescription({ type: 'answer', sdp });
    });

    socket.on('webrtc-ice-candidate', async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      await pcRef.current?.addIceCandidate(candidate);
    });

    socket.on('camera-error', () => setStatus('error'));
  };

  useEffect(() => {
    return () => {
      pcRef.current?.close();
      socketRef.current?.disconnect();
    };
  }, []);

  return (
    <div
      className={`bg-black rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${isSelected ? 'border-blue-500' : 'border-transparent'}`}
      onClick={() => { onSelect(); if (status === 'idle') connect(); }}
    >
      <div className="relative aspect-video bg-slate-900">
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        {status !== 'live' && (
          <div className="absolute inset-0 flex items-center justify-center">
            {status === 'idle' && <span className="text-slate-400 text-sm">Clique para conectar</span>}
            {status === 'connecting' && <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />}
            {status === 'error' && <span className="text-red-400 text-sm">Erro na conexão</span>}
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status === 'live' ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
            {status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            {status === 'live' ? 'AO VIVO' : status === 'connecting' ? 'Conectando' : 'Offline'}
          </span>
        </div>
      </div>
      <div className="p-3 bg-slate-800">
        <p className="text-white text-sm font-medium">{camera.name as string}</p>
        {camera.location && <p className="text-slate-400 text-xs">{camera.location as string}</p>}
      </div>
    </div>
  );
}

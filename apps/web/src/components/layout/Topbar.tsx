'use client';

import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { initials } from '@/lib/utils';
import { useState } from 'react';

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const { data: notifData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => api.get('/v1/notifications?limit=1&unreadOnly=true').then((r) => r.data.data ?? r.data),
    refetchInterval: 30_000,
  });

  const unreadCount = notifData?.unreadCount ?? 0;

  return (
    <header className="h-14 px-4 md:px-6 flex items-center justify-between bg-slate-900 border-b border-slate-800 shrink-0">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        aria-label="Abrir menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User menu */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                {initials(user.name)}
              </div>
              <span className="text-sm text-slate-300 hidden md:block font-medium">{user.name?.split(' ')[0]}</span>
              <svg className="w-3.5 h-3.5 text-slate-500 hidden md:block" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-52 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 py-1 z-50">
                  <div className="px-3 py-2.5 border-b border-slate-700">
                    <p className="text-xs font-semibold text-white">{user.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { setShowUserMenu(false); logout(); }}
                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                    Sair
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

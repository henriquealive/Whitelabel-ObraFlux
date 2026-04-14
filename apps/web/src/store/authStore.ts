import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, AuthTokens } from '@obraflux/shared';
import { api } from '@/lib/api';

interface AuthState {
  user: UserProfile | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  fetchProfile: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isLoading: false,

      setUser: (user) => set({ user }),
      setTokens: (tokens) => set({ tokens }),

      fetchProfile: async () => {
        const { tokens } = get();
        if (!tokens?.accessToken) {
          set({ isLoading: false });
          return;
        }
        set({ isLoading: true });
        try {
          const res = await api.get<UserProfile>('/v1/auth/me');
          set({ user: res.data, isLoading: false });
        } catch {
          set({ user: null, tokens: null, isLoading: false });
        }
      },

      logout: () => {
        set({ user: null, tokens: null });
        if (typeof window !== 'undefined') window.location.href = '/login';
      },
    }),
    {
      name: 'obraflux-auth',
      partialize: (state) => ({ tokens: state.tokens }),
    },
  ),
);

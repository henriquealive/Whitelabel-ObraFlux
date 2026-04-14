import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach Bearer token from localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('obraflux-auth');
      if (stored) {
        const parsed = JSON.parse(stored) as { state?: { tokens?: { accessToken?: string } } };
        const token = parsed?.state?.tokens?.accessToken;
        if (token) config.headers.Authorization = `Bearer ${token}`;
      }
    } catch { /* ignore */ }
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const stored = localStorage.getItem('obraflux-auth');
        if (stored) {
          const parsed = JSON.parse(stored) as { state?: { tokens?: { refreshToken?: string } } };
          const refreshToken = parsed?.state?.tokens?.refreshToken;
          if (refreshToken) {
            const res = await axios.post(`${BASE_URL}/v1/auth/refresh`, { refreshToken });
            const { accessToken, refreshToken: newRefresh } = res.data.data;
            const newState = { ...parsed, state: { ...parsed.state, tokens: { accessToken, refreshToken: newRefresh } } };
            localStorage.setItem('obraflux-auth', JSON.stringify(newState));
            original.headers.Authorization = `Bearer ${accessToken}`;
            return api(original);
          }
        }
      } catch { /* refresh failed */ }
    }
    return Promise.reject(error);
  },
);

export default api;

import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// SECURITY: httpOnly cannot be set from JavaScript — it must be set server-side.
// These tokens are therefore readable by any XSS payload.
// TODO: For production, proxy auth via a Next.js API route (e.g. /api/auth/*) that
// sets cookies with httpOnly=true; Secure; SameSite=Strict from the server response.
const COOKIE_OPTS: Cookies.CookieAttributes = {
  expires: 7,
  sameSite: 'strict',
  // httpOnly: true, // REMOVED - cannot be set from JS, must be set by server
  secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
};

export function storeAuthTokens(token: string, refreshToken: string, refreshTokenId: string) {
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  Cookies.set('token', token, { ...COOKIE_OPTS, secure });
  Cookies.set('refreshToken', refreshToken, { ...COOKIE_OPTS, secure });
  Cookies.set('refreshTokenId', refreshTokenId, { ...COOKIE_OPTS, secure });
}

export function clearAuthTokens() {
  Cookies.remove('token');
  Cookies.remove('refreshToken');
  Cookies.remove('refreshTokenId');
}

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function notifyRefreshSubscribers(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = Cookies.get('refreshToken');
      const refreshTokenId = Cookies.get('refreshTokenId');

      if (!refreshToken || !refreshTokenId) {
        clearAuthTokens();
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken, refreshTokenId });
        const { token, refreshToken: newRefreshToken, refreshTokenId: newRefreshTokenId } = res.data;
        storeAuthTokens(token, newRefreshToken, newRefreshTokenId);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        notifyRefreshSubscribers(token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch {
        clearAuthTokens();
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

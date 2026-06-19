import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Note: Tokens are now stored as httpOnly cookies by the server
// No client-side token storage for security

const api = axios.create({
  baseURL: API_URL,
});

// Authentication helper functions
export async function login(email: string, password: string) {
  const response = await axios.post('/api/auth/login', { email, password });
  return response.data;
}

export async function register(email: string, password: string) {
  const response = await axios.post('/api/auth/register', { email, password });
  return response.data;
}

export async function logout() {
  await axios.post('/api/auth/logout');
}

export async function getCurrentUser() {
  const response = await axios.get('/api/auth/me');
  return response.data;
}

export async function disconnectGmail() {
  const response = await axios.delete('/api/gmail/disconnect');
  return response.data;
}

// For non-auth API calls, we need to handle token refresh
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function notifyRefreshSubscribers(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

api.interceptors.request.use((config) => {
  // For non-auth endpoints, we still need to handle Authorization header
  // The token will be sent automatically by browser for same-origin requests
  // with httpOnly cookies
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

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
        const res = await axios.post('/api/auth/refresh');
        // Tokens are now httpOnly cookies, no need to store them
        notifyRefreshSubscribers('token-refreshed');
        originalRequest.headers.Authorization = `Bearer token-refreshed`;
        return api(originalRequest);
      } catch {
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export function clearAuthTokens() {
  // No-op - tokens are now httpOnly cookies handled by server
  // This function remains for backward compatibility
}

export default api;

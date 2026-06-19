import axios from 'axios';

// Note: Tokens are now stored as httpOnly cookies by the server
// No client-side token storage for security

const api = axios.create({
  baseURL: '/api',
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

// Password reset functions
export async function requestPasswordReset(email: string) {
  const response = await axios.post('/api/auth/request-password-reset', { email });
  return response.data;
}

export async function resetPassword(token: string, newPassword: string) {
  const response = await axios.post('/api/auth/reset-password', { token, newPassword });
  return response.data;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const response = await axios.post('/api/auth/change-password', { currentPassword, newPassword });
  return response.data;
}

// 2FA functions
export async function setupTwoFactor() {
  const response = await axios.post('/api/auth/2fa/setup');
  return response.data;
}

export async function enableTwoFactor(token: string) {
  const response = await axios.post('/api/auth/2fa/enable', { token });
  return response.data;
}

export async function disableTwoFactor(token: string) {
  const response = await axios.post('/api/auth/2fa/disable', { token });
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
          subscribeTokenRefresh(() => {
            delete originalRequest.headers.Authorization;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        await axios.post('/api/auth/refresh');
        // Tokens are httpOnly cookies — browser sends them automatically
        notifyRefreshSubscribers('');
        delete originalRequest.headers.Authorization;
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

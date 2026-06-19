import axios from 'axios';

// Note: Tokens are now stored as httpOnly cookies by the server
// No client-side token storage for security

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Ensure cookies are sent with requests
});

// Authentication helper functions
export async function login(email: string, password: string) {
  const response = await axios.post('/api/auth/login', { email, password }, { withCredentials: true });
  return response.data;
}

export async function register(email: string, password: string) {
  const response = await axios.post('/api/auth/register', { email, password }, { withCredentials: true });
  return response.data;
}

export async function logout() {
  await axios.post('/api/auth/logout', {}, { withCredentials: true });
}

export async function getCurrentUser() {
  const response = await axios.get('/api/auth/me', { withCredentials: true });
  
  // Validate that we have proper user data
  if (!response.data || !response.data.userId || !response.data.email) {
    throw new Error('Invalid authentication state');
  }
  
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
  const response = await axios.post('/api/auth/change-password', { currentPassword, newPassword }, { withCredentials: true });
  return response.data;
}

// 2FA functions
export async function setupTwoFactor() {
  const response = await axios.post('/api/auth/2fa/setup', {}, { withCredentials: true });
  return response.data;
}

export async function enableTwoFactor(token: string) {
  const response = await axios.post('/api/auth/2fa/enable', { token }, { withCredentials: true });
  return response.data;
}

export async function disableTwoFactor(token: string) {
  const response = await axios.post('/api/auth/2fa/disable', { token }, { withCredentials: true });
  return response.data;
}

export async function disconnectGmail() {
  const response = await axios.delete('/api/gmail/disconnect', { withCredentials: true });
  return response.data;
}

// Improved token refresh mechanism with proper race condition handling
let isRefreshing = false;
let refreshSubscribers: Array<(success: boolean) => void> = [];

function subscribeTokenRefresh(cb: (success: boolean) => void) {
  refreshSubscribers.push(cb);
}

function notifyRefreshSubscribers(success: boolean) {
  refreshSubscribers.forEach((cb) => cb(success));
  refreshSubscribers = [];
}

api.interceptors.request.use((config) => {
  // Ensure credentials are included for all requests
  config.withCredentials = true;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Wait for the current refresh to complete
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((success) => {
            if (success) {
              resolve(api(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      isRefreshing = true;
      try {
        await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        // Tokens are httpOnly cookies — browser sends them automatically
        notifyRefreshSubscribers(true);
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, notify all waiting requests
        notifyRefreshSubscribers(false);
        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
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

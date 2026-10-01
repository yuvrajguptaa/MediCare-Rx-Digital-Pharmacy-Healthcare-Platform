import axios from 'axios';

let rawApiUrl = import.meta.env.VITE_API_URL || 'https://medicare-rx-digital-pharmacy-healthcare.onrender.com/api/v1';
rawApiUrl = rawApiUrl.replace(/\/+$/, ''); // remove trailing slash
if (!rawApiUrl.endsWith('/api/v1')) {
  rawApiUrl = `${rawApiUrl}/api/v1`;
}
const API_BASE_URL = rawApiUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('medicare_access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('medicare_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh/`, { refresh_token: refreshToken });
          if (res.data?.tokens?.access_token) {
            localStorage.setItem('medicare_access_token', res.data.tokens.access_token);
            originalRequest.headers['Authorization'] = `Bearer ${res.data.tokens.access_token}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          localStorage.removeItem('medicare_access_token');
          localStorage.removeItem('medicare_refresh_token');
          localStorage.removeItem('medicare_user');
          window.dispatchEvent(new Event('medicare_auth_change'));
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:1990',
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach JWT token to every request ──
api.interceptors.request.use(
  config => {
    try {
      const stored = localStorage.getItem('cib_user');
      if (stored) {
        const user = JSON.parse(stored);
        if (user?.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      }
    } catch {
      // ignore parse errors
    }
    return config;
  },
  error => Promise.reject(error)
);

// ── Response interceptor — auto logout on 401 or 403 ──
// This fires when:
// 1. The user's account has been disabled
// 2. The JWT token has expired
// 3. The user no longer exists in the database
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Clear stored user data
      localStorage.removeItem('cib_user');
      // Redirect to login — hard redirect clears all React state too
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
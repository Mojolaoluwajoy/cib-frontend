import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:1990',
  headers: { 'Content-Type': 'application/json' },
});

// ── Attach JWT token to every request ──
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
      // ignore
    }
    return config;
  },
  error => Promise.reject(error)
);

// ── Auto logout on 401 ──
// This fires when:
// 1. User deleted from database
// 2. User deactivated (status = INACTIVE)
// 3. Organization disabled
// 4. Token expired
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Clear stored session
      localStorage.removeItem('cib_user');
      // Hard redirect clears all React state
      const publicPaths = ['/login', '/register',
        '/forgot-password', '/complete-registration'];
      const isPublic = publicPaths.some(p =>
        window.location.pathname.startsWith(p)
      );
      if (!isPublic) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
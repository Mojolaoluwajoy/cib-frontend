import axios from 'axios';
import { tokenRef } from '../context/AuthContext';

const api = axios.create({
  baseURL: 'http://localhost:1990',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  config => {
    let token = tokenRef.current;
    if (!token) {
      try {
        const stored = localStorage.getItem('cib_user');
        if (stored) token = JSON.parse(stored)?.token;
      } catch {}
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

api.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status;
    const url    = error.config?.url || '';
    if (status === 401 && !url.includes('/auth/login')) {
      tokenRef.current = null;
      localStorage.removeItem('cib_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
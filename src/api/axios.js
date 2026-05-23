import axios from 'axios';

// This is the base URL for all API calls
// Every request automatically goes to your Spring app on port 1990
const api = axios.create({
  baseURL: 'http://localhost:1990',
});

// This runs BEFORE every request
// It automatically adds the JWT token to every API call
// So you never have to manually add Authorization header in any page
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cib_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// This runs AFTER every response
// If your token has expired (401 error), it clears everything and sends you to login
// This handles session expiry automatically across the whole app
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
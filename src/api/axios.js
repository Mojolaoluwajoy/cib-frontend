import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:1990';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// The refresh token lives in an HttpOnly cookie that only the backend can read, and it is only
// sent to /auth. These calls must include credentials so the browser sends and stores that cookie.
export const authApi = axios.create({ baseURL, withCredentials: true });

// The access token is kept in memory only, never in localStorage, so scripts on the page cannot
// copy it from storage. After a reload it is fetched again with the refresh cookie.
let accessToken = null;

export function setAccessToken(token) {
  accessToken = token || null;
}

// Called when the session can no longer be renewed (set by AuthProvider)
let onSessionEnded = () => {};

export function setSessionEndedHandler(handler) {
  onSessionEnded = handler;
}

export async function login(credentials) {
  const res = await authApi.post('/auth/login', credentials);
  const data = res.data.data || res.data;
  setAccessToken(data.token);
  return data;
}

// Several requests can fail with 401 at once; they all wait for the same refresh
let refreshing = null;

async function requestNewAccessToken() {
  try {
    return await authApi.post('/auth/refresh');
  } catch (err) {
    if (err.response?.status !== 401) throw err;
    // Another tab may have just rotated the refresh token; its newer cookie is now in the browser
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return authApi.post('/auth/refresh');
  }
}

export function refreshSession() {
  if (!refreshing) {
    refreshing = requestNewAccessToken()
      .then((res) => {
        const data = res.data.data || res.data;
        setAccessToken(data.token);
        return data;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

// Ends the session on the server; the local session is cleared regardless of the outcome
export async function logout() {
  setAccessToken(null);
  try {
    await authApi.post('/auth/logout');
  } catch {
    // Already signed out on the server, or unreachable; the cookie expires on its own
  }
}

// ── Attach the access token to every request ──
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ── On 401, renew the access token once and retry ──
// Fires when the access token expired (every 30 minutes); if the session itself has ended
// (logged out elsewhere, password changed, user disabled), the refresh fails and the user is signed out.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || !original || original._retried || !accessToken) {
      return Promise.reject(error);
    }
    original._retried = true;
    try {
      await refreshSession();
    } catch {
      setAccessToken(null);
      onSessionEnded();
      return Promise.reject(error);
    }
    original.headers.Authorization = `Bearer ${accessToken}`;
    return api(original);
  },
);

export default api;

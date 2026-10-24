import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

// 30 minutes in milliseconds
export const INACTIVITY_LIMIT = 30 * 60 * 1000;
// Last activity time, shared by every open tab so one busy tab keeps the whole session alive
export const LAST_ACTIVE_KEY = 'cib_last_active';
// How often to check for inactivity, and the minimum gap between activity writes
const CHECK_INTERVAL = 15 * 1000;
const ACTIVITY_WRITE_INTERVAL = 5 * 1000;

const SIGNED_OUT = { token: null, role: null, name: null, email: null };

function clearSession() {
  localStorage.removeItem('cib_user');
  localStorage.removeItem(LAST_ACTIVE_KEY);
}

function isInactive() {
  const lastActive = Number(localStorage.getItem(LAST_ACTIVE_KEY));
  return !lastActive || Date.now() - lastActive > INACTIVITY_LIMIT;
}

// Reads the saved session, dropping it if it has been idle too long (e.g. the browser was closed)
function readStoredSession() {
  try {
    const stored = JSON.parse(localStorage.getItem('cib_user'));
    if (!stored?.token) return SIGNED_OUT;
    if (isInactive()) {
      clearSession();
      return SIGNED_OUT;
    }
    return stored;
  } catch {
    return SIGNED_OUT;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredSession);

  const [validating, setValidating] = useState(true);
  const lastActivityWrite = useRef(0);

  const logout = useCallback(() => {
    clearSession();
    setUser(SIGNED_OUT);
    const publicPaths = ['/login', '/register', '/forgot-password', '/complete-registration'];
    const isPublic = publicPaths.some((p) => window.location.pathname.startsWith(p));
    if (!isPublic) {
      window.location.href = '/login';
    }
  }, []);

  // ── Validate token on app startup ──
  // When the app loads, if a token exists in localStorage,
  // make a quick API call to confirm it is still valid.
  // If the backend returns 401, clear the session immediately.
  useEffect(() => {
    async function validateStoredToken() {
      const stored = localStorage.getItem('cib_user');
      if (!stored) {
        setValidating(false);
        return;
      }
      try {
        const parsed = JSON.parse(stored);
        if (!parsed?.token) {
          setValidating(false);
          return;
        }
        // Call a lightweight authenticated endpoint to verify token.
        // The api client attaches the stored token automatically.
        await api.get('/dashboard/stats');
        // If 200 — token is valid, keep user logged in
      } catch (err) {
        const status = err.response?.status;
        if (status === 401 || status === 403) {
          // Token invalid or user disabled/deleted — clear session
          clearSession();
          setUser(SIGNED_OUT);
        }
        // Network error — keep user logged in, they'll get kicked on next API call
      } finally {
        setValidating(false);
      }
    }
    validateStoredToken();
  }, []);

  // ── Inactivity logout ──
  // Activity in any tab updates the shared timestamp; every tab checks it periodically.
  useEffect(() => {
    if (!user?.token) return;
    function recordActivity() {
      const now = Date.now();
      if (now - lastActivityWrite.current < ACTIVITY_WRITE_INTERVAL) return;
      lastActivityWrite.current = now;
      localStorage.setItem(LAST_ACTIVE_KEY, String(now));
    }
    function checkInactivity() {
      if (isInactive()) logout();
    }
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'mousemove'];
    events.forEach((e) => window.addEventListener(e, recordActivity));
    const interval = setInterval(checkInactivity, CHECK_INTERVAL);
    return () => {
      events.forEach((e) => window.removeEventListener(e, recordActivity));
      clearInterval(interval);
    };
  }, [user?.token, logout]);

  // ── Follow sign-in and sign-out from other tabs ──
  useEffect(() => {
    function onStorage(e) {
      if (e.key !== 'cib_user' && e.key !== null) return;
      const next = readStoredSession();
      if (!next.token) logout();
      else setUser(next);
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [logout]);

  function login(data) {
    const userData = {
      token: data.token,
      role: data.role,
      name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
      email: data.email,
    };
    localStorage.setItem('cib_user', JSON.stringify(userData));
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
    setUser(userData);
  }

  // Show nothing while validating to prevent flash of wrong content
  if (validating) {
    return (
      <AuthContext.Provider value={{ user, login, logout }}>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-400">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="text-sm">Loading...</span>
          </div>
        </div>
      </AuthContext.Provider>
    );
  }
  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

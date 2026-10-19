import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const AuthContext = createContext(null);

// 30 minutes in milliseconds
const INACTIVITY_LIMIT = 30 * 60 * 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('cib_user');
      return stored ? JSON.parse(stored) : { token: null, role: null, name: null, email: null };
    } catch {
      return { token: null, role: null, name: null, email: null };
    }
  });

  const [validating, setValidating] = useState(true);
  const inactivityTimer = useRef(null);

  const logout = useCallback(() => {
    localStorage.removeItem('cib_user');
    setUser({ token: null, role: null, name: null, email: null });
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
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
        // Call a lightweight authenticated endpoint to verify token
        const res = await fetch('http://localhost:1990/dashboard/stats', {
          headers: {
            Authorization: `Bearer ${parsed.token}`,
            'Content-Type': 'application/json',
          },
        });
        if (res.status === 401 || res.status === 403) {
          // Token invalid or user disabled/deleted — clear session
          localStorage.removeItem('cib_user');
          setUser({ token: null, role: null, name: null, email: null });
        }
        // If 200 — token is valid, keep user logged in
      } catch {
        // Network error — keep user logged in, they'll get kicked on next API call
      } finally {
        setValidating(false);
      }
    }
    validateStoredToken();
  }, []);

  const resetTimer = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    if (user?.token) {
      inactivityTimer.current = setTimeout(() => {
        logout();
      }, INACTIVITY_LIMIT);
    }
  }, [user?.token, logout]);

  useEffect(() => {
    if (!user?.token) return;
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'mousemove'];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [user?.token, resetTimer]);

  function login(data) {
    const userData = {
      token: data.token,
      role: data.role,
      name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
      email: data.email,
    };
    localStorage.setItem('cib_user', JSON.stringify(userData));
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

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';

const AuthContext = createContext(null);

// 30 minutes in milliseconds
const INACTIVITY_LIMIT = 30 * 60 * 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('cib_user');
      return stored
        ? JSON.parse(stored)
        : { token: null, role: null, name: null, email: null };
    } catch {
      return { token: null, role: null, name: null, email: null };
    }
  });

  const inactivityTimer = useRef(null);

  // ── Clear everything and redirect to login ──
  const logout = useCallback((reason) => {
    localStorage.removeItem('cib_user');
    setUser({ token: null, role: null, name: null, email: null });
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    // Only redirect if we're not already on a public page
    const publicPaths = ['/login', '/register',
      '/forgot-password', '/complete-registration'];
    const isPublic = publicPaths.some(p =>
      window.location.pathname.startsWith(p)
    );
    if (!isPublic) {
      window.location.href = '/login';
    }
  }, []);

  // ── Reset inactivity timer on any user activity ──
  const resetTimer = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    if (user?.token) {
      inactivityTimer.current = setTimeout(() => {
        logout('inactivity');
      }, INACTIVITY_LIMIT);
    }
  }, [user?.token, logout]);

  // ── Attach activity listeners when logged in ──
  useEffect(() => {
    if (!user?.token) return;

    const events = [
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'mousemove',
    ];

    events.forEach(e => window.addEventListener(e, resetTimer));

    // Start the timer immediately
    resetTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, [user?.token, resetTimer]);

  // ── Login ──
  function login(data) {
    const userData = {
      token:     data.token,
      role:      data.role,
      name:      `${data.firstName || ''} ${data.lastName || ''}`.trim(),
      email:     data.email,
    };
    localStorage.setItem('cib_user', JSON.stringify(userData));
    setUser(userData);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
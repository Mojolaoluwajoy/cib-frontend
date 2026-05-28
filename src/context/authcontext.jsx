import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const AuthContext = createContext(null);

const INACTIVITY_LIMIT = 60 * 60 * 1000; // 1 hour in milliseconds

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('cib_user');
      return stored ? JSON.parse(stored) : { token: null, role: null, name: null, email: null };
    } catch {
      return { token: null, role: null, name: null, email: null };
    }
  });

  const inactivityTimer = useRef(null);

  // ── Clear user from state and storage ──
  const logout = useCallback(() => {
    localStorage.removeItem('cib_user');
    setUser({ token: null, role: null, name: null, email: null });
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
  }, []);

  // ── Reset the inactivity timer on any user activity ──
  const resetTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (user?.token) {
      inactivityTimer.current = setTimeout(() => {
        logout();
        window.location.href = '/login';
      }, INACTIVITY_LIMIT);
    }
  }, [user?.token, logout]);

  // ── Attach activity listeners when user is logged in ──
  useEffect(() => {
    if (!user?.token) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, resetTimer));

    // Start timer immediately on mount
    resetTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [user?.token, resetTimer]);

  // ── Login — save user to state and localStorage ──
  function login(data) {
    // data comes from your LoginResponse
    // it has: token, role, firstName, lastName, email
    const userData = {
      token: data.token,
      role:  data.role,
      name:  `${data.firstName || ''} ${data.lastName || ''}`.trim(),
      email: data.email,
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
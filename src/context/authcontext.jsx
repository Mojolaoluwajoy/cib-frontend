import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const AuthContext = createContext(null);

const INACTIVITY_LIMIT = 60 * 60 * 1000;

export const tokenRef = { current: null };

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

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cib_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        tokenRef.current = parsed?.token || null;
      }
    } catch {}
  }, []);

  const logout = useCallback(() => {
    tokenRef.current = null;
    localStorage.removeItem('cib_user');
    setUser({ token: null, role: null, name: null, email: null });
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
  }, []);

  const resetTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (user?.token) {
      inactivityTimer.current = setTimeout(() => {
        logout();
        window.location.href = '/login';
      }, INACTIVITY_LIMIT);
    }
  }, [user?.token, logout]);

  useEffect(() => {
    if (!user?.token) return;
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [user?.token, resetTimer]);

  function login(data) {
    const userData = {
      token: data.token,
      role:  data.role,
      name:  `${data.firstName || ''} ${data.lastName || ''}`.trim(),
      email: data.email,
    };
    tokenRef.current = data.token;
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
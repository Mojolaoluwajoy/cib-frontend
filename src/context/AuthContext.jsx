import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  logout as endServerSession,
  refreshSession,
  setAccessToken,
  setSessionEndedHandler,
} from '../api/axios';

const AuthContext = createContext(null);

// 30 minutes in milliseconds
export const INACTIVITY_LIMIT = 30 * 60 * 1000;
// Last activity time, shared by every open tab so one busy tab keeps the whole session alive
export const LAST_ACTIVE_KEY = 'cib_last_active';
// How often to check for inactivity, and the minimum gap between activity writes
const CHECK_INTERVAL = 15 * 1000;
const ACTIVITY_WRITE_INTERVAL = 5 * 1000;

const SIGNED_OUT = { token: null, role: null, name: null, email: null };
// localStorage keeps only who is signed in (for the UI and other tabs); the access token stays in
// memory and the refresh token in an HttpOnly cookie.
const PROFILE_KEY = 'cib_user';

function clearSession() {
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(LAST_ACTIVE_KEY);
}

function isInactive() {
  const lastActive = Number(localStorage.getItem(LAST_ACTIVE_KEY));
  return !lastActive || Date.now() - lastActive > INACTIVITY_LIMIT;
}

// Reads who was signed in, dropping it if the session has been idle too long (e.g. the browser was closed)
function readStoredProfile() {
  try {
    const stored = JSON.parse(localStorage.getItem(PROFILE_KEY));
    if (!stored?.role) return null;
    if (isInactive()) {
      clearSession();
      return null;
    }
    return { role: stored.role, name: stored.name, email: stored.email };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(SIGNED_OUT);
  // Renewing the access token on startup; the app waits so it doesn't flash the login page
  const [validating, setValidating] = useState(() => readStoredProfile() !== null);
  const lastActivityWrite = useRef(0);
  // Set while signing out, so repeated triggers (e.g. the inactivity check) don't sign out twice
  const signingOut = useRef(false);

  // Clears this tab's session and goes to the login page
  const endLocalSession = useCallback(() => {
    setAccessToken(null);
    clearSession();
    setUser(SIGNED_OUT);
    const publicPaths = ['/login', '/register', '/forgot-password', '/complete-registration'];
    const isPublic = publicPaths.some((p) => window.location.pathname.startsWith(p));
    if (!isPublic) {
      window.location.href = '/login';
    }
  }, []);

  // Signs out everywhere: the backend ends the session, so other tabs and devices using it stop working.
  // Waits for the backend before leaving the page, which would otherwise cancel the request.
  const logout = useCallback(async () => {
    if (signingOut.current) return;
    signingOut.current = true;
    try {
      await endServerSession();
      endLocalSession();
    } finally {
      signingOut.current = false;
    }
  }, [endLocalSession]);

  // A request found the session over (expired, ended elsewhere, password changed)
  useEffect(() => {
    setSessionEndedHandler(endLocalSession);
  }, [endLocalSession]);

  // Restores the session after a reload or in a new tab, using the refresh cookie
  const resume = useCallback(async (profile) => {
    try {
      const data = await refreshSession();
      setUser({ ...profile, token: data.token });
    } catch (err) {
      // The backend refused the cookie: the session is over. Network errors leave the profile for next time.
      if (err.response) clearSession();
      setUser(SIGNED_OUT);
    }
  }, []);

  useEffect(() => {
    const profile = readStoredProfile();
    if (!profile) return;
    // resume only sets state after the refresh request answers, so this is not a synchronous update
    // eslint-disable-next-line react-hooks/set-state-in-effect
    resume(profile).finally(() => setValidating(false));
  }, [resume]);

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
      if (e.key !== PROFILE_KEY && e.key !== null) return;
      const profile = readStoredProfile();
      // The other tab already ended the session on the server
      if (!profile) endLocalSession();
      else if (!user.token) resume(profile);
      else setUser((current) => ({ ...current, ...profile }));
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [endLocalSession, resume, user.token]);

  // Called after a successful login (and by the profile page when the name or email changes)
  function login(data) {
    const profile = {
      role: data.role,
      name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
      email: data.email,
    };
    setAccessToken(data.token);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
    setUser({ ...profile, token: data.token });
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

import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logout as endServerSession, refreshSession } from '../api/axios';
import { AuthProvider, INACTIVITY_LIMIT, LAST_ACTIVE_KEY, useAuth } from './AuthContext';

vi.mock('../api/axios', () => ({
  refreshSession: vi.fn(),
  logout: vi.fn(() => Promise.resolve()),
  setAccessToken: vi.fn(),
  setSessionEndedHandler: vi.fn(),
}));

const MINUTE = 60 * 1000;
// Only the profile is stored; the token comes from refreshing with the cookie
const profile = { role: 'MAKER', name: 'Test User', email: 'test@corp.com' };

function Status() {
  const { user, logout } = useAuth();
  return (
    <div>
      <span>{user.token ? `signed in with ${user.token}` : 'signed out'}</span>
      <button onClick={logout}>Sign out</button>
    </div>
  );
}

async function renderProvider() {
  render(
    <AuthProvider>
      <Status />
    </AuthProvider>,
  );
  // Let the startup token check finish
  await act(async () => {});
}

const advance = (ms) => act(() => vi.advanceTimersByTime(ms));

describe('AuthProvider session', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Stay on a public page so signing out does not try to navigate
    window.history.pushState({}, '', '/login');
    vi.clearAllMocks();
    refreshSession.mockResolvedValue({ token: 'fresh-token' });
    localStorage.setItem('cib_user', JSON.stringify(profile));
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('drops a saved session that went idle while the browser was closed', async () => {
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now() - INACTIVITY_LIMIT - MINUTE));
    await renderProvider();
    expect(screen.getByText('signed out')).toBeInTheDocument();
    expect(localStorage.getItem('cib_user')).toBeNull();
  });

  it('signs out after 30 minutes without activity in any tab', async () => {
    await renderProvider();
    advance(29 * MINUTE);
    expect(screen.getByText('signed in with fresh-token')).toBeInTheDocument();
    advance(2 * MINUTE);
    // Signing out waits for the backend to end the session
    await act(async () => {});
    expect(screen.getByText('signed out')).toBeInTheDocument();
    expect(endServerSession).toHaveBeenCalledTimes(1);
  });

  it('stays signed in while another tab is active', async () => {
    await renderProvider();
    advance(25 * MINUTE);
    // Another tab records activity
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
    advance(25 * MINUTE);
    expect(screen.getByText('signed in with fresh-token')).toBeInTheDocument();
  });

  it('counts activity in this tab', async () => {
    await renderProvider();
    advance(25 * MINUTE);
    act(() => window.dispatchEvent(new Event('keydown')));
    advance(25 * MINUTE);
    expect(screen.getByText('signed in with fresh-token')).toBeInTheDocument();
  });

  it('signs out when another tab signs out', async () => {
    await renderProvider();
    localStorage.removeItem('cib_user');
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'cib_user' })));
    expect(screen.getByText('signed out')).toBeInTheDocument();
  });

  it('restores the session after a reload by refreshing with the cookie', async () => {
    await renderProvider();
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(screen.getByText('signed in with fresh-token')).toBeInTheDocument();
  });

  it('signs out when the backend refuses the refresh cookie', async () => {
    refreshSession.mockRejectedValue({ response: { status: 401 } });
    await renderProvider();
    expect(screen.getByText('signed out')).toBeInTheDocument();
    expect(localStorage.getItem('cib_user')).toBeNull();
  });

  it('never stores a token in localStorage', async () => {
    await renderProvider();
    expect(JSON.stringify({ ...localStorage })).not.toContain('fresh-token');
  });

  it('ends the session on the server when signing out', async () => {
    await renderProvider();
    await act(async () => screen.getByRole('button', { name: 'Sign out' }).click());
    expect(endServerSession).toHaveBeenCalledTimes(1);
    expect(screen.getByText('signed out')).toBeInTheDocument();
  });
});

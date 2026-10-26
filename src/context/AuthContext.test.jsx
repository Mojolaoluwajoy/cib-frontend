import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, INACTIVITY_LIMIT, LAST_ACTIVE_KEY, useAuth } from './AuthContext';

vi.mock('../api/axios', () => ({ default: { get: vi.fn(() => Promise.resolve({})) } }));

const MINUTE = 60 * 1000;
const session = { token: 't', role: 'MAKER', name: 'Test User', email: 'test@corp.com' };

function Status() {
  const { user } = useAuth();
  return <div>{user.token ? 'signed in' : 'signed out'}</div>;
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
    localStorage.setItem('cib_user', JSON.stringify(session));
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
    expect(screen.getByText('signed in')).toBeInTheDocument();
    advance(2 * MINUTE);
    expect(screen.getByText('signed out')).toBeInTheDocument();
  });

  it('stays signed in while another tab is active', async () => {
    await renderProvider();
    advance(25 * MINUTE);
    // Another tab records activity
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
    advance(25 * MINUTE);
    expect(screen.getByText('signed in')).toBeInTheDocument();
  });

  it('counts activity in this tab', async () => {
    await renderProvider();
    advance(25 * MINUTE);
    act(() => window.dispatchEvent(new Event('keydown')));
    advance(25 * MINUTE);
    expect(screen.getByText('signed in')).toBeInTheDocument();
  });

  it('signs out when another tab signs out', async () => {
    await renderProvider();
    localStorage.removeItem('cib_user');
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'cib_user' })));
    expect(screen.getByText('signed out')).toBeInTheDocument();
  });
});

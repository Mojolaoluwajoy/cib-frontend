import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import api, { authApi, login, logout, setAccessToken, setSessionEndedHandler } from './axios';

// Fake network: each adapter records the requests it receives and answers from a handler
function fakeAdapter(handler) {
  const calls = [];
  const adapter = async (config) => {
    calls.push(config);
    const { status = 200, data = {} } = await handler(config, calls.length);
    const response = { data, status, headers: {}, config, request: {} };
    if (status >= 400) {
      const error = new Error(`Request failed with status ${status}`);
      error.config = config;
      error.response = response;
      throw error;
    }
    return response;
  };
  adapter.calls = calls;
  return adapter;
}

const tokenOf = (config) => config.headers.Authorization;

describe('api client session handling', () => {
  let sessionEnded;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    sessionEnded = vi.fn();
    setSessionEndedHandler(sessionEnded);
    setAccessToken('old-token');
  });

  afterEach(() => {
    vi.useRealTimers();
    setAccessToken(null);
  });

  it('renews an expired access token once and retries the request', async () => {
    api.defaults.adapter = fakeAdapter((config) =>
      tokenOf(config) === 'Bearer new-token' ? { data: { ok: true } } : { status: 401 },
    );
    authApi.defaults.adapter = fakeAdapter(() => ({ data: { data: { token: 'new-token' } } }));

    const res = await api.get('/dashboard/stats');

    expect(res.data).toEqual({ ok: true });
    expect(authApi.defaults.adapter.calls.map((c) => c.url)).toEqual(['/auth/refresh']);
  });

  it('shares one refresh between requests that fail together', async () => {
    api.defaults.adapter = fakeAdapter((config) =>
      tokenOf(config) === 'Bearer new-token' ? { data: {} } : { status: 401 },
    );
    authApi.defaults.adapter = fakeAdapter(() => ({ data: { data: { token: 'new-token' } } }));

    await Promise.all([api.get('/a'), api.get('/b'), api.get('/c')]);

    expect(authApi.defaults.adapter.calls).toHaveLength(1);
  });

  it('signs out when the session cannot be renewed', async () => {
    api.defaults.adapter = fakeAdapter(() => ({ status: 401 }));
    authApi.defaults.adapter = fakeAdapter(() => ({ status: 401 }));

    await expect(api.get('/dashboard/stats')).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(sessionEnded).toHaveBeenCalledTimes(1);
    // The refresh is retried once, in case another tab had just rotated the cookie
    expect(authApi.defaults.adapter.calls).toHaveLength(2);
  });

  it('sends cookies only to the auth endpoints', async () => {
    api.defaults.adapter = fakeAdapter(() => ({ data: {} }));
    authApi.defaults.adapter = fakeAdapter(() => ({ data: { data: { token: 'login-token' } } }));

    await login({ email: 'a@b.co', password: 'secret123' });
    await api.get('/dashboard/stats');
    await logout();

    expect(authApi.defaults.adapter.calls.every((c) => c.withCredentials)).toBe(true);
    expect(api.defaults.adapter.calls[0].withCredentials).toBeFalsy();
    expect(tokenOf(api.defaults.adapter.calls[0])).toBe('Bearer login-token');
  });
});

import { describe, expect, it } from 'vitest';
import { loadErrorMessage } from './loadError';

describe('loadErrorMessage', () => {
  it('explains a network failure', () => {
    expect(loadErrorMessage(new Error('Network Error'), 'users')).toBe(
      'Could not reach the server to load users. Check your connection.',
    );
  });

  it('explains a permission failure', () => {
    expect(loadErrorMessage({ response: { status: 403 } }, 'users')).toBe(
      "You don't have permission to view users.",
    );
  });

  it('prefers the message from the backend', () => {
    expect(loadErrorMessage({ response: { status: 500, data: { message: 'DB down' } } })).toBe(
      'DB down',
    );
  });

  it('falls back to a generic message', () => {
    expect(loadErrorMessage({ response: { status: 500 } }, 'accounts')).toBe(
      'Failed to load accounts. Please try again.',
    );
  });
});

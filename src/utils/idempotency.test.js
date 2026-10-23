import { describe, expect, it } from 'vitest';
import { idempotencyKeyFor } from './idempotency';

describe('idempotencyKeyFor', () => {
  it('reuses the key when the same request is retried', () => {
    const ref = { current: null };
    const first = idempotencyKeyFor(ref, { amount: 500 });
    expect(idempotencyKeyFor(ref, { amount: 500 })).toBe(first);
  });

  it('creates a new key when the request changes', () => {
    const ref = { current: null };
    const first = idempotencyKeyFor(ref, { amount: 500 });
    expect(idempotencyKeyFor(ref, { amount: 600 })).not.toBe(first);
  });

  it('creates a new key after the ref is cleared on success', () => {
    const ref = { current: null };
    const first = idempotencyKeyFor(ref, { amount: 500 });
    ref.current = null;
    expect(idempotencyKeyFor(ref, { amount: 500 })).not.toBe(first);
  });
});

// Returns the idempotency key for a request. Retrying the exact same request reuses its key so
// the backend can drop the duplicate; any change to the request gets a fresh key.
export function idempotencyKeyFor(keyRef, payload) {
  const body = JSON.stringify(payload);
  if (keyRef.current?.body !== body) {
    keyRef.current = { body, key: crypto.randomUUID() };
  }
  return keyRef.current.key;
}

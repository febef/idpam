import assert from 'node:assert/strict';
import test from 'node:test';
import { issueToken, normalizeTokenLifetime } from '../src/lib/management/tokenPolicy.js';

test('issues unique opaque tokens and stores only their hash', () => {
  const a = issueToken();
  const b = issueToken();
  assert.match(a.token, /^[a-f0-9]{64}$/);
  assert.notEqual(a.token, b.token);
  assert.notEqual(a.token, a.tokenHash);
});

test('bounds token expiration to the disposable demo cycle', () => {
  assert.ok(normalizeTokenLifetime('1') > new Date());
  for (const value of ['0', '25', '1.5', 'abc']) assert.throws(() => normalizeTokenLifetime(value));
});

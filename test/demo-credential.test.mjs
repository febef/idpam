import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeSimpleCredentialInput } from '../src/lib/management/credentialPolicy.js';

test('validates a new simple credential without exposing or transforming its password', () => {
  const data = normalizeSimpleCredentialInput({ name: ' Test ', userfacade: 'test.user', password: 'demo-password-123', roleIds: [], enabled: 'on' }, { creating: true });
  assert.equal(data.name, 'Test');
  assert.equal(data.password, 'demo-password-123');
  assert.equal(data.enabled, true);
});

test('rejects weak passwords and unknown role IDs', () => {
  assert.throws(() => normalizeSimpleCredentialInput({ name: 'Test', userfacade: 'test', password: 'short' }, { creating: true }));
  assert.throws(() => normalizeSimpleCredentialInput({ name: 'Test', userfacade: 'test', password: 'demo-password-123', roleIds: ['admin'] }, { creating: true }));
});

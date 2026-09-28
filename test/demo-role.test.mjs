import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizePermissionInput, normalizeRoleName } from '../src/lib/demo/rolePolicy.js';

test('accepts bounded role names and permission targets', () => {
  assert.equal(normalizeRoleName('  Demo Operator '), 'Demo Operator');
  assert.deepEqual(normalizePermissionInput({ targets: 'identity:*, role:abc', verbs: 'read, edit' }), {
    targetObjects: ['identity:*', 'role:abc'], verbs: ['read', 'edit'], domain: 'demo'
  });
});

test('rejects executable function targets and unknown verbs', () => {
  for (const fields of [
    { targets: '#getFrontEndClass', verbs: 'execute' },
    { targets: 'identity:*', verbs: 'superuser' },
    { targets: 'identity:*,', verbs: '' }
  ]) assert.throws(() => normalizePermissionInput(fields));
  assert.throws(() => normalizeRoleName('$where'));
});

// Contract: docs/demo-contract.md. A verb never bypasses its target boundary.
import assert from 'node:assert/strict';
import test from 'node:test';

import { roleAllows } from '../src/lib/am/permissionMatch.js';

test('allows an exact target and verb', () => {
  const role = { permissions: [{ targetObjects: ['identity:123'], verbs: ['read'] }] };

  assert.equal(roleAllows(role, 'read', 'identity:123'), true);
  assert.equal(roleAllows(role, 'edit', 'identity:123'), false);
  assert.equal(roleAllows(role, 'read', 'identity:456'), false);
});

test('a function permission cannot authorize another function', () => {
  const role = {
    permissions: [{ targetObjects: ['#getFrontEndClass'], verbs: ['execute'] }]
  };

  assert.equal(roleAllows(role, 'execute', '#getFrontEndClass'), true);
  assert.equal(roleAllows(role, 'execute', '#deleteEverything'), false);
});

test('a target prefix wildcard remains scoped to its prefix', () => {
  const role = { permissions: [{ targetObjects: ['identity:*'], verbs: ['read'] }] };

  assert.equal(roleAllows(role, 'read', 'identity:123'), true);
  assert.equal(roleAllows(role, 'read', 'role:123'), false);
});

test('missing or malformed permissions fail closed', () => {
  assert.equal(roleAllows({ permissions: [] }, 'read', 'identity:123'), false);
  assert.equal(roleAllows({ permissions: [{ verbs: ['read'] }] }, 'read', 'identity:123'), false);
  assert.equal(roleAllows(null, 'read', 'identity:123'), false);
});

import assert from 'node:assert/strict';
import test from 'node:test';

import { currentTenantId, runWithTenant } from '../src/lib/demo/tenantContext.js';
import Identity from '../src/lib/db/models/Identity.js';

test('tenant context fails closed and remains isolated across async work', async () => {
  assert.throws(() => currentTenantId(), /tenant context/i);

  const values = await Promise.all([
    runWithTenant('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', async () => {
      await new Promise(resolve => setImmediate(resolve));
      return currentTenantId();
    }),
    runWithTenant('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', async () => {
      await new Promise(resolve => setImmediate(resolve));
      return currentTenantId();
    })
  ]);

  assert.deepEqual(values, [
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  ]);
  assert.throws(() => currentTenantId(), /tenant context/i);
});

test('the internal tenant boundary is excluded from normal projections', () => {
  assert.equal(Identity.schema.path('tenantId').options.select, false);
  const document = new Identity({
    tenantId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    domain: 'demo'
  });
  assert.equal(document.toJSON().tenantId, undefined);
});

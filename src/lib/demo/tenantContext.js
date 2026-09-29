import { AsyncLocalStorage } from 'node:async_hooks';

const storage = new AsyncLocalStorage();
const tenantPattern = /^[a-f0-9-]{16,64}$/i;

export function assertTenantId(value) {
  if (typeof value !== 'string' || !tenantPattern.test(value)) {
    throw new Error('A valid demo tenant context is required');
  }
  return value;
}

export function currentTenantId() {
  return assertTenantId(storage.getStore()?.tenantId);
}

export function runWithTenant(tenantId, operation) {
  return storage.run({ tenantId: assertTenantId(tenantId) }, operation);
}

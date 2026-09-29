import { randomUUID } from 'node:crypto';
import DemoTenant from '../db/models/DemoTenant.js';
import { clearDemoTenant, resetAndSeedDemo } from './resetAndSeed.js';
import { assertTenantId } from './tenantContext.js';

const inFlight = new Map();

export function newTenantId() { return randomUUID(); }

export async function ensureDemoTenant(models, tenantId, { password, issuer, lifetimeSeconds }) {
  assertTenantId(tenantId);
  if (!inFlight.has(tenantId)) {
    inFlight.set(tenantId, (async () => {
      const now = new Date();
      const current = await DemoTenant.findOne({ tenantId });
      if (current && current.expiresAt > now) return current;

      if (current) await clearDemoTenant(models, tenantId);
      const adminCredentialId = await resetAndSeedDemo(models, tenantId, password, issuer);
      return DemoTenant.findOneAndUpdate(
        { tenantId },
        { tenantId, adminCredentialId, expiresAt: new Date(Date.now() + lifetimeSeconds * 1000) },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    })().finally(() => inFlight.delete(tenantId)));
  }
  return inFlight.get(tenantId);
}

export async function removeExpiredTenants(models) {
  const expired = await DemoTenant.find({ expiresAt: { $lte: new Date() } }).select('tenantId').lean();
  for (const { tenantId } of expired) {
    await clearDemoTenant(models, tenantId);
    await DemoTenant.deleteOne({ tenantId });
  }
  return expired.length;
}

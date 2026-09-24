// Disposable fixture lifecycle for docs/demo-contract.md.
// The URI guard runs again at the destructive boundary, not only at startup.
import mongoose from 'mongoose';
import { demoResetConfig } from './resetConfig.js';

export async function resetAndSeedDemo(models, uri, intervalSeconds, password) {
  demoResetConfig(uri, String(intervalSeconds));

  if (typeof password !== 'string' || password.length < 12) {
    throw new Error('Demo password must contain at least 12 characters');
  }

  await mongoose.connection.dropDatabase();

  const permission = await models.permission.create({
    domain: 'demo',
    targetObjects: ['identity:*'],
    verbs: ['read']
  });
  const role = await models.role.create({
    name: 'DemoReader',
    permissions: [permission._id]
  });
  const metadata = await models.metadata.create({ nickName: 'Demo' });
  const credential = await models.simplecredential.create({
    name: 'demo',
    userfacade: 'demo',
    password,
    enabled: true,
    roles: [role._id]
  });
  await models.identity.create({
    domain: 'demo',
    type: 'user',
    credentials: { simplecredentials: [credential._id] },
    metadatas: metadata._id
  });

  await Promise.all([
    models.role.syncIndexes(),
    models.simplecredential.syncIndexes()
  ]);
}

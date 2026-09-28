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

  // These identities are synthetic records, not login accounts. They can be
  // edited through the narrow demo profile workflow and disappear on reset.
  for (const profile of [
    { nickName: 'Ada', names: ['Ada'], lastNames: ['Lovelace'], email: 'ada@idpam.test' },
    { nickName: 'Grace', names: ['Grace'], lastNames: ['Hopper'], email: 'grace@idpam.test' },
    { nickName: 'Lin', names: ['Lin'], lastNames: ['Demo'], email: 'lin@example.test' }
  ]) {
    const record = await models.metadata.create(profile);
    const ldapCredential = profile.nickName === 'Lin' ? null : await models.ldapcredential.create({
      name: 'LDAP vía Dex', issuer: 'http://127.0.0.1:5556/dex',
      email: profile.email, enabled: true, roles: [role._id]
    });
    await models.identity.create({
      domain: 'demo', type: 'user',
      credentials: ldapCredential ? { ldapcredentials: [ldapCredential._id] } : {},
      metadatas: record._id
    });
  }

  await Promise.all([
    models.role.syncIndexes(),
    models.simplecredential.syncIndexes()
  ]);
  return credential._id;
}

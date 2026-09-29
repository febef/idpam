import { runWithTenant } from './tenantContext.js';

const ownedModelNames = [
  'identity', 'metadata', 'permission', 'role', 'simplecredential',
  'tokencredential', 'sshkeycredential', 'ldapcredential'
];

export async function clearDemoTenant(models, tenantId) {
  await runWithTenant(tenantId, async () => {
    for (const name of ownedModelNames) await models[name].deleteMany({});
  });
}

export async function resetAndSeedDemo(models, tenantId, password, oidcIssuer) {
  if (typeof password !== 'string' || password.length < 12) {
    throw new Error('Demo password must contain at least 12 characters');
  }
  if (typeof oidcIssuer !== 'string' || !oidcIssuer) throw new Error('OIDC issuer is required');

  await clearDemoTenant(models, tenantId);
  return runWithTenant(tenantId, async () => {
    const permission = await models.permission.create({
      domain: 'demo', targetObjects: ['identity:*'], verbs: ['read']
    });
    const role = await models.role.create({ name: 'DemoReader', permissions: [permission._id] });
    const metadata = await models.metadata.create({ nickName: 'Demo' });
    const credential = await models.simplecredential.create({
      name: 'demo', userfacade: 'demo', password, enabled: true, roles: [role._id]
    });
    await models.identity.create({
      domain: 'demo', type: 'user',
      credentials: { simplecredentials: [credential._id] }, metadatas: metadata._id
    });

    for (const profile of [
      { nickName: 'Ada', names: ['Ada'], lastNames: ['Lovelace'], email: 'ada@idpam.test' },
      { nickName: 'Grace', names: ['Grace'], lastNames: ['Hopper'], email: 'grace@idpam.test' },
      { nickName: 'Lin', names: ['Lin'], lastNames: ['Demo'], email: 'lin@example.test' }
    ]) {
      const record = await models.metadata.create(profile);
      const ldapCredential = profile.nickName === 'Lin' ? null : await models.ldapcredential.create({
        name: 'LDAP vía Dex', issuer: oidcIssuer,
        email: profile.email, enabled: true, roles: [role._id]
      });
      await models.identity.create({
        domain: 'demo', type: 'user',
        credentials: ldapCredential ? { ldapcredentials: [ldapCredential._id] } : {},
        metadatas: record._id
      });
    }
    return credential._id;
  });
}

// Opt-in runtime test. Set RUN_HTTP_TEST=1 against the isolated local Compose app.
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import test from 'node:test';

function sshPublicKey(key) {
  const raw = Buffer.from(key.export({ format: 'jwk' }).x, 'base64url');
  const algorithm = Buffer.from('ssh-ed25519');
  const size = value => { const bytes = Buffer.alloc(4); bytes.writeUInt32BE(value.length); return bytes; };
  return `ssh-ed25519 ${Buffer.concat([size(algorithm), algorithm, size(raw), raw]).toString('base64')}`;
}

test('the local demo supports scoped profile edits and rejects broad mutations',
  { skip: process.env.RUN_HTTP_TEST !== '1' }, async () => {
    const base = 'http://127.0.0.1:3000';
    const health = await fetch(`${base}/healthz`);
    assert.equal(health.status, 200);
    assert.equal(await health.text(), 'ok');
    assert.equal(health.headers.get('set-cookie'), null);
    const runId = Date.now().toString(36);
    const roleName = `DemoOperator${runId}`;
    const identityName = `Tess ${runId}`;
    const username = `tess.${runId}`;
    const tokenName = `QA temporal ${runId}`;
    const sshName = `QA Ed25519 ${runId}`;
    const extraName = `Tessa${runId}`;
    const replacementName = `Marta${runId}`;
    const login = await fetch(`${base}/login`, {
      method: 'POST', redirect: 'manual',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ userfacade: 'demo', password: 'demo-idpam-only-2026' })
    });
    assert.equal(login.status, 302);
    let cookie = login.headers.get('set-cookie')?.split(';')[0];
    assert.ok(cookie);

    const request = (path, options = {}) => fetch(`${base}${path}`, {
      redirect: 'manual', ...options, headers: { cookie, ...options.headers }
    });
    const identities = await request('/identities');
    assert.equal(identities.status, 200);
    const html = await identities.text();
    assert.match(html, /<h3>Identities<\/h3>/);
    assert.doesNotMatch(html, /data-open="profile-[a-f0-9]{24}"/);
    assert.match(html, /data-inline-field="nickName"[^>]*data-inline-form="profile-[a-f0-9]{24}"/);
    assert.match(html, /data-inline-field="email"[^>]*data-inline-form="profile-[a-f0-9]{24}"/);
    assert.match(html, /<dialog class="dialog" id="create-identity"/);
    const homeHtml = await (await request('/')).text();
    assert.match(homeHtml, /<main[^>]+id="main-content"/);
    assert.doesNotMatch(homeHtml, /<img src=""/);
    assert.match(homeHtml, /class="motionToggle"/);
    assert.match(homeHtml, /id="home-profile-form"/);
    assert.match(homeHtml, /id="home-add-simplecredentials"/);
    assert.match(homeHtml, /id="home-add-tokencredentials"/);
    assert.match(homeHtml, /id="home-add-sshkeycredentials"/);
    assert.match(homeHtml, /id="home-token-issued"/);
    const currentIdentityId = homeHtml.match(/<main[^>]+data-identity-id="([a-f0-9]{24})"/)?.[1];
    assert.ok(currentIdentityId);
    const match = html.match(/action="(\/demo\/identities\/([a-f0-9]{24})\/profile)"[^>]*>[\s\S]*?name="csrfToken" value="([a-f0-9]{64})"/);
    assert.ok(match, 'an editable synthetic identity has a CSRF-protected form');
    const [, path, , initialCsrfToken] = match;
    let csrfToken = initialCsrfToken;
    const body = new URLSearchParams({ nickName: 'Ada HTTP', names: 'Ada', lastNames: 'Lovelace', email: 'ada@example.test' });

    const rejected = await request(path, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body });
    assert.equal(rejected.status, 403);
    body.set('csrfToken', csrfToken);
    body.set('roles', 'admin');
    const injected = await request(path, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body });
    assert.equal(injected.status, 400);
    body.delete('roles');
    const saved = await request(path, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body });
    assert.equal(saved.status, 303);
    assert.match(await (await request('/identities')).text(), /Ada HTTP/);

    const secondaryName = `Secondary ${runId}`;
    const secondaryUser = `secondary.${runId}`;
    assert.equal((await request(`/identities/${currentIdentityId}/credentials/simple`, {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        csrfToken, name: secondaryName, userfacade: secondaryUser,
        password: 'demo-secondary-pass-2026', enabled: 'on'
      })
    })).status, 303);
    const editableCredentialsHtml = await (await request('/identities')).text();
    const secondaryId = editableCredentialsHtml.match(
      new RegExp(`data-inline-form="edit-simple-([a-f0-9]{24})"[^>]*[^<]*${secondaryName}`)
    )?.[1];
    assert.ok(secondaryId, 'a secondary credential on the active identity remains editable');
    assert.match(editableCredentialsHtml, new RegExp(`id="edit-simple-${secondaryId}"`));
    assert.equal((await request(`/credentials/simple/${secondaryId}`, {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ csrfToken, name: `${secondaryName} edited`, enabled: 'on' })
    })).status, 303);
    assert.match(await (await request('/identities')).text(), new RegExp(`${secondaryName} edited`));

    const roles = await request('/roles');
    assert.equal(roles.status, 200);
    assert.match(await roles.text(), /DemoReader/);
    assert.doesNotMatch(await (await request('/guide')).text(), /Un recorrido por IdPAM/);
    const broad = await request('/lapi', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ verb: 'edit', target: 'role:any' }) });
    assert.equal(broad.status, 410);
    assert.equal((await request('/lapi/delete/role:any/x')).status, 410);

    const createRole = await request('/roles', {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ csrfToken, name: roleName })
    });
    assert.equal(createRole.status, 303);
    const rolesHtml = await (await request('/roles')).text();
    const roleId = rolesHtml.match(new RegExp(`${roleName}[\\s\\S]*?action="/roles/([a-f0-9]{24})"`))?.[1];
    assert.ok(roleId);
    const addPermission = await request(`/roles/${roleId}/permissions`, {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ csrfToken, targets: 'identity:*', verbs: 'read, edit' })
    });
    assert.equal(addPermission.status, 303);
    const check = await request('/access/check', {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ csrfToken, roleId, target: 'identity:example', verb: 'edit' })
    });
    assert.deepEqual(await check.json(), { role: roleName, target: 'identity:example', verb: 'edit', allowed: true });

    const createIdentity = await request('/identities', {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ csrfToken, type: 'user', nickName: identityName, names: 'Tess', lastNames: 'QA', email: 'tess@example.test' })
    });
    assert.equal(createIdentity.status, 303);
    const identityHtml = await (await request('/identities')).text();
    const identityId = identityHtml.match(new RegExp(`${identityName}@demo[\\s\\S]*?action="/demo/identities/([a-f0-9]{24})/profile"`))?.[1];
    assert.ok(identityId);
    const nameItemsPath = `/identities/${identityId}/metadata/names/items`;
    const appendName = new URLSearchParams({ operation: 'append', value: extraName });
    assert.equal((await request(nameItemsPath, {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: appendName
    })).status, 403);
    appendName.set('csrfToken', csrfToken);
    assert.equal((await request(nameItemsPath, {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: appendName
    })).status, 303);
    assert.match(await (await request('/identities')).text(), new RegExp(`Editar names">Tess, ${extraName}`));
    assert.equal((await request(nameItemsPath, {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ csrfToken, operation: 'replace', index: '1', value: replacementName })
    })).status, 303);
    assert.match(await (await request('/identities')).text(), new RegExp(`Editar names">Tess, ${replacementName}`));
    assert.equal((await request(`/demo/identities/${identityId}/profile`, {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ csrfToken, nickName: identityName, names: 'Tessie', lastNames: 'QA', email: 'tess@example.test' })
    })).status, 303);
    assert.match(await (await request('/identities')).text(), new RegExp(`Editar names">Tessie, ${replacementName}`));
    const deleteName = new URLSearchParams({ csrfToken, operation: 'delete', index: '0' });
    assert.equal((await request(nameItemsPath, {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: deleteName
    })).status, 303);
    assert.match(await (await request('/identities')).text(), new RegExp(`Editar names">${replacementName}`));
    deleteName.set('index', '9');
    assert.equal((await request(nameItemsPath, {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: deleteName
    })).status, 400);
    assert.equal((await request(`/identities/${identityId}/metadata/nickName/items`, {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: appendName
    })).status, 400);
    deleteName.set('index', '0');
    assert.equal((await request(nameItemsPath, {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: deleteName
    })).status, 303);
    assert.doesNotMatch(await (await request('/identities')).text(), new RegExp(`Editar names">${replacementName}`));
    const createCredential = await request(`/identities/${identityId}/credentials/simple`, {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ csrfToken, name: 'demo', userfacade: username, password: 'demo-test-pass-123', enabled: 'on', roleIds: roleId })
    });
    assert.equal(createCredential.status, 303);
    const testLogin = await fetch(`${base}/login`, {
      method: 'POST', redirect: 'manual',
      headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ userfacade: username, password: 'demo-test-pass-123' })
    });
    assert.equal(testLogin.status, 302);
    assert.equal(testLogin.headers.get('location'), '/');
    const testCookie = testLogin.headers.get('set-cookie')?.split(';')[0];
    const deniedRoles = await fetch(`${base}/roles`, { headers: { cookie: testCookie }, redirect: 'manual' });
    assert.equal(deniedRoles.status, 403);
    const deniedMutation = await fetch(`${base}/roles`, {
      method: 'POST', redirect: 'manual',
      headers: { cookie: testCookie, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ csrfToken, name: 'Unauthorized' })
    });
    assert.equal(deniedMutation.status, 403);

    const restoreAdmin = async activeCookie => {
      const response = await fetch(`${base}/login`, {
        method: 'POST', redirect: 'manual',
        headers: { cookie: activeCookie, 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ userfacade: 'demo', password: 'demo-idpam-only-2026' })
      });
      assert.equal(response.headers.get('location'), '/');
      return response.headers.get('set-cookie')?.split(';')[0];
    };
    cookie = await restoreAdmin(testCookie);
    csrfToken = (await (await request('/identities')).text())
      .match(/name="csrfToken" value="([a-f0-9]{64})"/)?.[1];
    assert.ok(csrfToken);

    const issued = await request(`/identities/${identityId}/credentials/token`, {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ csrfToken, name: tokenName, hours: '1', roleIds: roleId })
    });
    assert.equal(issued.status, 200);
    assert.match(issued.headers.get('cache-control') || '', /no-store/);
    const token = (await issued.text()).match(/<code>([a-f0-9]{64})<\/code>/)?.[1];
    assert.ok(token, 'token is returned once after issuance');
    const issuedOnHome = await request(`/identities/${identityId}/credentials/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
      body: new URLSearchParams({ csrfToken, name: `QA home ${runId}`, hours: '1', roleIds: roleId })
    });
    assert.equal(issuedOnHome.status, 201);
    assert.match(issuedOnHome.headers.get('cache-control') || '', /no-store/);
    assert.match((await issuedOnHome.json()).token, /^[a-f0-9]{64}$/);
    const tokenLogin = await fetch(`${base}/login`, {
      method: 'POST', redirect: 'manual',
      headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token })
    });
    assert.equal(tokenLogin.status, 302);
    const tokenCookie = tokenLogin.headers.get('set-cookie')?.split(';')[0];
    assert.equal((await fetch(`${base}/`, { headers: { cookie: tokenCookie }, redirect: 'manual' })).status, 200);
    cookie = await restoreAdmin(tokenCookie);
    csrfToken = (await (await request('/identities')).text())
      .match(/name="csrfToken" value="([a-f0-9]{64})"/)?.[1];
    assert.ok(csrfToken);
    const tokenId = (await (await request('/identities')).text()).match(new RegExp(`${tokenName}[\\s\\S]*?data-delete="/credentials/token/([a-f0-9]{24})/delete"`))?.[1];
    assert.ok(tokenId);
    assert.equal((await request(`/credentials/token/${tokenId}/delete`, {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ csrfToken })
    })).status, 303);
    assert.equal((await fetch(`${base}/`, { headers: { cookie: tokenCookie }, redirect: 'manual' })).status, 302);
    const revokedLogin = await fetch(`${base}/login`, {
      method: 'POST', redirect: 'manual',
      headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token })
    });
    assert.equal(revokedLogin.headers.get('location'), '/login');

    const keys = generateKeyPairSync('ed25519');
    assert.equal((await request(`/identities/${identityId}/credentials/ssh`, {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ csrfToken, name: sshName, publicKey: sshPublicKey(keys.publicKey), roleIds: roleId })
    })).status, 303);
    const sshId = (await (await request('/identities')).text()).match(new RegExp(`${sshName}[\\s\\S]*?data-delete="/credentials/ssh/([a-f0-9]{24})/delete"`))?.[1];
    assert.ok(sshId);
    const challengeResponse = await fetch(`${base}/login/ssh/challenge`, {
      method: 'POST', headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ credentialId: sshId })
    });
    assert.equal(challengeResponse.status, 200);
    const challengeCookie = challengeResponse.headers.get('set-cookie')?.split(';')[0];
    const challenge = await challengeResponse.json();
    const signature = sign(null, Buffer.from(challenge.message), keys.privateKey).toString('base64');
    const verifyRequest = () => fetch(`${base}/login/ssh/verify`, {
      method: 'POST', redirect: 'manual',
      headers: { cookie: challengeCookie, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ credentialId: sshId, signature })
    });
    const sshLogin = await verifyRequest();
    assert.equal(sshLogin.headers.get('location'), '/');
    assert.equal((await verifyRequest()).headers.get('location'), '/login');
  });

test('two browser sessions receive independent disposable tenants',
  { skip: process.env.RUN_HTTP_TEST !== '1' }, async () => {
    const base = 'http://127.0.0.1:3000';
    const start = async () => {
      const page = await fetch(`${base}/login`);
      let cookie = page.headers.get('set-cookie')?.split(';')[0];
      const login = await fetch(`${base}/login`, {
        method: 'POST', redirect: 'manual',
        headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ userfacade: 'demo', password: 'demo-idpam-only-2026' })
      });
      cookie = login.headers.get('set-cookie')?.split(';')[0];
      const roles = await fetch(`${base}/roles`, { headers: { cookie } });
      const html = await roles.text();
      return {
        cookie,
        csrfToken: html.match(/name="csrfToken" value="([a-f0-9]{64})"/)?.[1]
      };
    };

    const [visitorA, visitorB] = await Promise.all([start(), start()]);
    const uniqueRole = `OnlyVisitorA${Date.now().toString(36)}`;
    const created = await fetch(`${base}/roles`, {
      method: 'POST', redirect: 'manual',
      headers: { cookie: visitorA.cookie, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ csrfToken: visitorA.csrfToken, name: uniqueRole })
    });
    assert.equal(created.status, 303);

    const aHtml = await (await fetch(`${base}/roles`, { headers: { cookie: visitorA.cookie } })).text();
    const roleId = aHtml.match(new RegExp(`${uniqueRole}[\\s\\S]*?action="/roles/([a-f0-9]{24})"`))?.[1];
    assert.ok(roleId);
    const bHtml = await (await fetch(`${base}/roles`, { headers: { cookie: visitorB.cookie } })).text();
    assert.doesNotMatch(bHtml, new RegExp(uniqueRole));

    const crossTenantEdit = await fetch(`${base}/roles/${roleId}`, {
      method: 'POST', redirect: 'manual',
      headers: { cookie: visitorB.cookie, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ csrfToken: visitorB.csrfToken, name: 'CrossTenantDenied' })
    });
    assert.equal(crossTenantEdit.status, 404);
  });

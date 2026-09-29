import assert from 'node:assert/strict';
import test from 'node:test';

import { publicRuntimePolicy } from '../src/lib/demo/runtimePolicy.js';

test('public demo requires an HTTPS origin and matching OIDC callback', () => {
  assert.deepEqual(publicRuntimePolicy({
    publicOrigin: 'https://idpam.demos.apx.domus.land',
    issuer: 'https://idpam.demos.apx.domus.land/dex',
    redirectUri: 'https://idpam.demos.apx.domus.land/oidc/callback'
  }), {
    publicOrigin: 'https://idpam.demos.apx.domus.land',
    issuer: 'https://idpam.demos.apx.domus.land/dex',
    redirectUri: 'https://idpam.demos.apx.domus.land/oidc/callback'
  });

  assert.throws(() => publicRuntimePolicy({
    publicOrigin: 'http://idpam.demos.apx.domus.land',
    issuer: 'https://idpam.demos.apx.domus.land/dex',
    redirectUri: 'https://idpam.demos.apx.domus.land/oidc/callback'
  }));
  assert.throws(() => publicRuntimePolicy({
    publicOrigin: 'https://idpam.demos.apx.domus.land',
    issuer: 'https://idpam.demos.apx.domus.land/dex',
    redirectUri: 'https://other.example/oidc/callback'
  }));
});

// Safety contract: docs/demo-contract.md. Reset must never target arbitrary Mongo.
import assert from 'node:assert/strict';
import test from 'node:test';

import { demoResetConfig } from '../src/lib/demo/resetConfig.js';

test('accepts only the isolated compose Mongo database', () => {
  assert.deepEqual(
    demoResetConfig('mongodb://mongo:27017/idpam_demo', '3600'),
    { intervalSeconds: 3600 }
  );

  for (const uri of [
    'mongodb://localhost:27017/idpam_demo',
    'mongodb://mongo:27017/production',
    'mongodb://user:pass@mongo:27017/idpam_demo',
    'mongodb://mongo:27017/idpam_demo?authSource=admin'
  ]) {
    assert.throws(() => demoResetConfig(uri, '3600'));
  }
});

test('rejects disabled, extreme or malformed reset intervals', () => {
  for (const interval of ['0', '-1', '1.5', 'abc', '59', '86401']) {
    assert.throws(() => demoResetConfig('mongodb://mongo:27017/idpam_demo', interval));
  }
});

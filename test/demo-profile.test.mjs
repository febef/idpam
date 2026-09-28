import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeDemoProfileInput, replaceFirstDemoNameItem, updateDemoNameItems } from '../src/lib/demo/profilePolicy.js';

const valid = { nickName: '  Ada  ', names: 'Ada', lastNames: 'Lovelace', email: 'ada@example.test' };

test('normalizes a synthetic profile without changing the caller input', () => {
  assert.deepEqual(normalizeDemoProfileInput(valid), { ...valid, nickName: 'Ada' });
  assert.equal(valid.nickName, '  Ada  ');
});

test('rejects unknown fields, invalid email and empty nickname', () => {
  for (const input of [
    { ...valid, roles: ['admin'] },
    { ...valid, email: 'not-an-email' },
    { ...valid, nickName: ' ' },
    { ...valid, names: { $set: 'admin' } }
  ]) assert.throws(() => normalizeDemoProfileInput(input));
});

test('adds and removes one metadata name without changing the other values', () => {
  const names = ['Ada', 'Augusta'];
  assert.deepEqual(updateDemoNameItems(names, { operation: 'append', value: ' Byron ' }), ['Ada', 'Augusta', 'Byron']);
  assert.deepEqual(updateDemoNameItems(names, { operation: 'replace', index: 1, value: ' Byron ' }), ['Ada', 'Byron']);
  assert.deepEqual(updateDemoNameItems(names, { operation: 'delete', index: 0 }), ['Augusta']);
  assert.deepEqual(names, ['Ada', 'Augusta']);
  assert.deepEqual(updateDemoNameItems(['Ada'], { operation: 'delete', index: 0 }), []);
});

test('rejects ambiguous or invalid metadata name operations', () => {
  const names = ['Ada'];
  for (const operation of [
    { operation: 'append', value: '' },
    { operation: 'append', value: 'a'.repeat(61) },
    { operation: 'delete', index: -1 },
    { operation: 'delete', index: 1 },
    { operation: 'delete', index: '0' },
    { operation: 'replace', index: 0, value: '' },
    { operation: 'replace', index: 1, value: 'x'.repeat(61) },
    { operation: 'replace', index: 9, value: 'Grace' }
  ]) assert.throws(() => updateDemoNameItems(names, operation));
});

test('editing the first name keeps later names intact', () => {
  assert.deepEqual(replaceFirstDemoNameItem(['Ada', 'Augusta'], 'Grace'), ['Grace', 'Augusta']);
  assert.deepEqual(replaceFirstDemoNameItem(['Ada', 'Augusta'], ''), ['Augusta']);
  assert.deepEqual(replaceFirstDemoNameItem([], 'Grace'), ['Grace']);
  assert.deepEqual(replaceFirstDemoNameItem([], ''), []);
});

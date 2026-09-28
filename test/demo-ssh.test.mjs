import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import test from 'node:test';
import { issueSshChallenge, parseSshEd25519, verifySshProof } from '../src/lib/management/sshProof.js';

function sshPublicKey(key) {
  const raw = Buffer.from(key.export({ format: 'jwk' }).x, 'base64url');
  const algorithm = Buffer.from('ssh-ed25519');
  const size = value => { const bytes = Buffer.alloc(4); bytes.writeUInt32BE(value.length); return bytes; };
  return `ssh-ed25519 ${Buffer.concat([size(algorithm), algorithm, size(raw), raw]).toString('base64')} demo@test`;
}

test('an Ed25519 SSH public key proves possession of its private key for one challenge', () => {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const key = sshPublicKey(publicKey);
  assert.match(parseSshEd25519(key).normalized, /^ssh-ed25519 /);
  const challenge = issueSshChallenge();
  const signature = sign(null, Buffer.from(`idpam-demo-ssh-v1:${challenge}`), privateKey).toString('base64');
  assert.equal(verifySshProof(key, challenge, signature), true);
  assert.equal(verifySshProof(key, issueSshChallenge(), signature), false);
  assert.equal(verifySshProof(key, challenge, Buffer.alloc(64).toString('base64')), false);
});

test('rejects algorithm mismatch and malformed SSH public keys', () => {
  const { publicKey } = generateKeyPairSync('ed25519');
  assert.throws(() => parseSshEd25519(sshPublicKey(publicKey).replace(/^ssh-ed25519/, 'ssh-rsa')), TypeError);
  assert.throws(() => parseSshEd25519('ssh-ed25519 AAAA'), TypeError);
});

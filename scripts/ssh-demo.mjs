#!/usr/bin/env node
// Local helper: private keys never travel to IdPAM. Use a disposable path
// outside this repository, such as /private/tmp/idpam-demo-key.pem.
import { generateKeyPairSync, createPrivateKey, sign } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const [action, path, challenge] = process.argv.slice(2);
if (!['generate', 'sign'].includes(action) || !path || (action === 'sign' && !challenge)) {
  console.error('Usage: node scripts/ssh-demo.mjs generate <private-key-path> | sign <private-key-path> <challenge>');
  process.exitCode = 2;
} else if (action === 'generate') {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const pem = privateKey.export({ type: 'pkcs8', format: 'pem' });
  await writeFile(path, pem, { mode: 0o600, flag: 'wx' });
  const raw = Buffer.from(publicKey.export({ format: 'jwk' }).x, 'base64url');
  const algorithm = Buffer.from('ssh-ed25519');
  const size = value => { const bytes = Buffer.alloc(4); bytes.writeUInt32BE(value.length); return bytes; };
  const encoded = Buffer.concat([size(algorithm), algorithm, size(raw), raw]).toString('base64');
  console.log(`Private key saved at ${path} (mode 0600). Register this public key:`);
  console.log(`ssh-ed25519 ${encoded} idpam-demo`);
} else {
  if (!/^idpam-demo-ssh-v1:[A-Za-z0-9_-]{43}$/.test(challenge)) {
    throw new TypeError('Invalid IdPAM challenge');
  }
  const privateKey = createPrivateKey(await readFile(path));
  if (privateKey.asymmetricKeyType !== 'ed25519') throw new TypeError('An Ed25519 key is required');
  console.log(sign(null, Buffer.from(challenge, 'utf8'), privateKey).toString('base64'));
}

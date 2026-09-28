import { createPublicKey, randomBytes, verify } from 'node:crypto';

// RFC 8709 SSH Ed25519 public keys contain two SSH strings: the algorithm and
// the 32-byte public key. Parsing is deliberately strict to avoid key confusion.
export function parseSshEd25519(value) {
  if (typeof value !== 'string' || value.length > 1024) throw new TypeError('Invalid SSH public key');
  const [algorithm, encoded] = value.trim().split(/\s+/, 3);
  if (algorithm !== 'ssh-ed25519' || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded || '')) {
    throw new TypeError('Only ssh-ed25519 public keys are supported');
  }
  const blob = Buffer.from(encoded, 'base64');
  let offset = 0;
  const read = () => {
    if (offset + 4 > blob.length) throw new TypeError('Truncated SSH public key');
    const size = blob.readUInt32BE(offset);
    offset += 4;
    if (size > 256 || offset + size > blob.length) throw new TypeError('Malformed SSH public key');
    const part = blob.subarray(offset, offset + size);
    offset += size;
    return part;
  };
  if (read().toString('ascii') !== 'ssh-ed25519') throw new TypeError('Mismatched SSH algorithm');
  const raw = read();
  if (raw.length !== 32 || offset !== blob.length) throw new TypeError('Invalid Ed25519 key length');
  const publicKey = createPublicKey({ key: { kty: 'OKP', crv: 'Ed25519', x: raw.toString('base64url') }, format: 'jwk' });
  return { publicKey, normalized: `ssh-ed25519 ${blob.toString('base64')}` };
}

export function issueSshChallenge() {
  return randomBytes(32).toString('base64url');
}

export function verifySshProof(publicKeyText, challenge, signatureText) {
  if (typeof challenge !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(challenge) ||
      typeof signatureText !== 'string' || !/^[A-Za-z0-9+/]{86}==$/.test(signatureText)) return false;
  const signature = Buffer.from(signatureText, 'base64');
  if (signature.length !== 64) return false;
  const { publicKey } = parseSshEd25519(publicKeyText);
  return verify(null, Buffer.from(`idpam-demo-ssh-v1:${challenge}`, 'utf8'), publicKey, signature);
}

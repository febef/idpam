import { createHash, randomBytes } from 'node:crypto';

export function issueToken() {
  const token = randomBytes(32).toString('hex');
  return { token, tokenHash: createHash('sha256').update(token, 'utf8').digest('hex') };
}

export function normalizeTokenLifetime(value) {
  const hours = Number(value);
  if (!Number.isInteger(hours) || hours < 1 || hours > 24) {
    throw new TypeError('Token lifetime must be 1–24 hours');
  }
  return new Date(Date.now() + hours * 3600_000);
}

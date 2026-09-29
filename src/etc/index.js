// Local demo composition configuration; contract: docs/demo-contract.md.
// Required values are supplied by the launch environment, never source control.
import { randomBytes } from 'crypto';
import { publicRuntimePolicy } from '../lib/demo/runtimePolicy.js';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for the IdPAM demo`);
  return value;
}

if (process.env.IDPAM_DEMO_MODE !== '1') {
  throw new Error('This branch only supports IDPAM_DEMO_MODE=1');
}

const mongoUri = required('MONGODB_URI');
const sessionSecret = process.env.SESSION_SECRET || randomBytes(32).toString('hex');
const isPublic = process.env.IDPAM_PUBLIC_DEMO === '1';

if (sessionSecret.length < 32) {
  throw new Error('SESSION_SECRET must contain at least 32 characters');
}

if (!/^mongodb:\/\/[^/]+\/idpam_demo(?:\?.*)?$/.test(mongoUri)) {
  throw new Error('MONGODB_URI must target the idpam_demo database');
}

const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be between 1 and 65535');
}

const oidc = isPublic ? publicRuntimePolicy({
  publicOrigin: required('PUBLIC_ORIGIN'),
  issuer: required('OIDC_ISSUER'),
  redirectUri: required('OIDC_REDIRECT_URI')
}) : {
  publicOrigin: 'http://127.0.0.1:3000',
  issuer: 'http://127.0.0.1:5556/dex',
  redirectUri: 'http://127.0.0.1:3000/oidc/callback'
};

export default {
  server: {
    port,
    host: process.env.BIND_HOST || '127.0.0.1',
    logger: ':method :url :status :res[content-length] - :response-time ms',
    trustProxy: isPublic ? 1 : false
  },
  database: { uri: mongoUri },
  idp: { ldap: {}, oidc },
  wadmin: {
    sessionSecret,
    mongoUri,
    secureCookie: isPublic,
    oidc,
    tenantLifetimeSeconds: Number(process.env.RESET_INTERVAL_SECONDS || '3600')
  }
};

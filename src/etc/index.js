// Local demo composition configuration; contract: docs/demo-contract.md.
// Required values are supplied by the launch environment, never source control.
import { randomBytes } from 'crypto';

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

export default {
  server: {
    port,
    host: process.env.BIND_HOST || '127.0.0.1',
    logger: ':method :url :status :res[content-length] - :response-time ms'
  },
  database: { uri: mongoUri },
  idp: { ldap: {} },
  wadmin: { sessionSecret }
};

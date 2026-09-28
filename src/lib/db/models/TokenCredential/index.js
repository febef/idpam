import mongoose from 'mongoose'
import { createHash } from 'node:crypto'

const TokenCredentialSchema = new mongoose.Schema({
  tokenHash: { type: String, select: false, unique: true, sparse: true },
  name: { type: String},
  enabled: { type: Boolean, default: true },
  expiresAt: { type: Date, required: true },
  roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }]
});

TokenCredentialSchema.statics.verifyMethod = function(data) {
  return typeof data.token === 'string' && data.token.length >= 32;
};

TokenCredentialSchema.statics.configure = function(configs) {
  return true;
};

TokenCredentialSchema.statics.authenticate = async function({ token }) {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/i.test(token)) return null;
  const tokenHash = createHash('sha256').update(token, 'utf8').digest('hex');
  return this.findOne({ tokenHash, enabled: true, expiresAt: { $gt: new Date() } });
};

export default mongoose.model("TokenCredential", TokenCredentialSchema);

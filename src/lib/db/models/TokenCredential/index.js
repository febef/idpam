import mongoose from 'mongoose'
import { createHash } from 'node:crypto'
import { tenantPlugin } from '../../../demo/tenantPlugin.js'

const TokenCredentialSchema = new mongoose.Schema({
  tokenHash: { type: String, select: false },
  name: { type: String},
  enabled: { type: Boolean, default: true },
  expiresAt: { type: Date, required: true },
  roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }]
});

TokenCredentialSchema.plugin(tenantPlugin);
TokenCredentialSchema.index({ tenantId: 1, tokenHash: 1 }, { unique: true, sparse: true });

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

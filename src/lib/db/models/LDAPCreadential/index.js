import mongoose from 'mongoose'
import { tenantPlugin } from '../../../demo/tenantPlugin.js'

const LDAPCredentialSchema = new mongoose.Schema({
  issuer: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  name: { type: String},
  enabled: { type: Boolean, default: true },
  roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }]
});

LDAPCredentialSchema.plugin(tenantPlugin);
LDAPCredentialSchema.index({ tenantId: 1, issuer: 1, email: 1 }, { unique: true });

LDAPCredentialSchema.statics.verifyMethod = function(data) {
  return false;
};

LDAPCredentialSchema.statics.configure = function(configs) {
  return true;
};

LDAPCredentialSchema.statics.authenticate = function(authData) {
  return null; // Dex validates LDAP credentials; no direct password is accepted here.
};


export default mongoose.model("LDAPCredential", LDAPCredentialSchema);

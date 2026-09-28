import mongoose from 'mongoose'

const LDAPCredentialSchema = new mongoose.Schema({
  issuer: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  name: { type: String},
  enabled: { type: Boolean, default: true },
  roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }]
});

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

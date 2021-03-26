import mongoose from 'mongoose'

const LDAPCredentialSchema = new mongoose.Schema({
  cn: [{ type: String }],
  password: [{ type: String }],
  name: { type: String},
  roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }]
});

LDAPCredentialSchema.statics.verifyMethod = function(data) {
  return false;
};

LDAPCredentialSchema.statics.configure = function(configs) {
  return true;
};

LDAPCredentialSchema.statics.authenticate = function(authData) {
  return true;
};


export default mongoose.model("LDAPCredential", LDAPCredentialSchema);

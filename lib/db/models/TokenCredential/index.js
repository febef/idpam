import mongoose from 'mongoose'

const TokenCredentialSchema = new mongoose.Schema({
  token: [{ type: String }],
  name: { type: String},
  roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }]
});

TokenCredentialSchema.statics.verifyMethod = function(data) {
  return false;
};

TokenCredentialSchema.statics.configure = function(configs) {
  return true;
};

TokenCredentialSchema.statics.authenticate = function(authData) {
  return true;
};

export default mongoose.model("TokenCredential", TokenCredentialSchema);

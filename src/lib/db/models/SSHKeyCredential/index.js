import mongoose from 'mongoose'

const SSHKeyCredentialSchema = new mongoose.Schema({
  publickey: [{ type: String }],
  pribatekey: [{ type: String }],
  password: [{ type: String }],
  name: { type: String},
  roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }]
});

SSHKeyCredentialSchema.statics.verifyMethod = function(data) {
  return false;
};

SSHKeyCredentialSchema.statics.configure = function(configs) {
  return true;
};

SSHKeyCredentialSchema.statics.authenticate = function(authData) {
  return true;
};

export default mongoose.model("SSHKeyCredential", SSHKeyCredentialSchema);

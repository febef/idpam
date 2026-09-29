import mongoose from 'mongoose'
import { tenantPlugin } from '../../../demo/tenantPlugin.js'

const SSHKeyCredentialSchema = new mongoose.Schema({
  publicKey: { type: String, required: true },
  name: { type: String},
  enabled: { type: Boolean, default: true },
  roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }]
});

SSHKeyCredentialSchema.plugin(tenantPlugin);

SSHKeyCredentialSchema.statics.verifyMethod = function(data) {
  return false;
};

SSHKeyCredentialSchema.statics.configure = function(configs) {
  return true;
};

SSHKeyCredentialSchema.statics.authenticate = function(authData) {
  return null;
};

export default mongoose.model("SSHKeyCredential", SSHKeyCredentialSchema);

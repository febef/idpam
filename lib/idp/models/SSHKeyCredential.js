import mongoose from 'mongoose'

const SSHKeyCredentialSchema = new mongoose.Schema({
  publickey: [{ type: String }],
  pribatekey: [{ type: String }],
  password: [{ type: String }],
  permissions: [{ type: ObjectId, ref: 'Permission' }]
});

export default mongoose.model("SSHKeyCredential", SSHKeyCredentialSchema);

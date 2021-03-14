import mongoose from 'mongoose'

const LDAPCredentialSchema = new mongoose.Schema({
  cn: [{ type: String }],
  password: [{ type: String }],
  permissions: [{ type: ObjectId, ref: 'Permission' }]
});

export default mongoose.model("LDAPCredential", LDAPCredentialSchema);

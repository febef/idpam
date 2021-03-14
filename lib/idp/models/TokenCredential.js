import mongoose from 'mongoose'

const TokenCredentialSchema = new mongoose.Schema({
  token: [{ type: String }],
  permissions: [{ type: ObjectId, ref: 'Permission' }]
});

export default mongoose.model("TokenCredential", TokenCredentialSchema);

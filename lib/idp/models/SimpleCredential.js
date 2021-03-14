import mongoose from 'mongoose'

const SimpleCredentialSchema = new mongoose.Schema({
  userfacade: [{ type: String }],
  password: [{ type: String }],
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }]
});

export default mongoose.model("SimpleCredential", SimpleCredentialSchema);


import mongoose from 'mongoose'

const ObjectId = mongoose.Schema.Types.ObjectId

const IdentitySchema = new mongoose.Schema({
  domain: { type: String },
  type: { type: String, enum: ['user', 'application'], default: 'user'},
  credentials: {
    simples: [{ type: ObjectId, ref: 'SimpleCredential' }],
    tokens: [{ type: ObjectId, ref: 'TokenCredential' }],
    sshkeys: [{ type: ObjectId, ref: 'SSHKeyCredential'}],
    ldaps: [{ type: ObjectId, ref: 'LDAPCredential' }]
  },
  defaultPermissions: [{ type: ObjectId, ref: 'Permission' }],
  metadata: { type: ObjectId, ref: 'IdMetaData' }
});

export default mongoose.model("Identity", IdentitySchema);

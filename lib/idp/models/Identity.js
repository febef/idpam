
import mongoose from 'mongoose'

const ObjectId = mongoose.Schema.Types.ObjectId

const IdentitySchema = new mongoose.Schema({
  domain: { type: String },
  type: { type: String, enum: ['user', 'application'], default: 'user'},
  credentials: {
    simple: [{ type: ObjectId, ref: 'SimpleCredential' }],
    token: [{ type: ObjectId, ref: 'TokenCredential' }],
    sshkey: [{ type: ObjectId, ref: 'SSHKeyCredential'}],
    ldap: [{ type: ObjectId, ref: 'LDAPCredential' }]
  },
  defaultroles: [{ type: ObjectId, ref: 'Permission' }],
  metadata: { type: ObjectId, ref: 'IdMetaData' }
});

export default mongoose.model("Identity", IdentitySchema);


import mongoose from 'mongoose'
import { tenantPlugin } from '../../demo/tenantPlugin.js'

const ObjectId = mongoose.Schema.Types.ObjectId

const IdentitySchema = new mongoose.Schema({
  domain: { type: String },
  type: { type: String, enum: ['user', 'service'], default: 'user'},
  credentials: {
    simplecredentials: [{ type: ObjectId, ref: 'SimpleCredential' }],
    tokencredentials: [{ type: ObjectId, ref: 'TokenCredential' }],
    sshkeycredentials: [{ type: ObjectId, ref: 'SSHKeyCredential'}],
    ldapcredentials: [{ type: ObjectId, ref: 'LDAPCredential' }]
  },
  metadatas: { type: ObjectId, ref: 'MetaData' }
});

IdentitySchema.plugin(tenantPlugin);

export default mongoose.model("Identity", IdentitySchema);

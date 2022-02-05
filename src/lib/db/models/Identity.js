
import mongoose from 'mongoose'

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

export default mongoose.model("Identity", IdentitySchema);

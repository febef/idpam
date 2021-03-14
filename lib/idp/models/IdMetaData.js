
import mongoose from 'mongoose'

const IdMetaDataSchema = new mongoose.Schema({
  names: [{ type: String }],
  lastNames: [{ type: String }],
  nickName: { type: String },
  email: { type: String}
});

export default mongoose.model("IdMetaData", IdMetaDataSchema);

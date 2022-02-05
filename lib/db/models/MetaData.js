
import mongoose from 'mongoose'

const MetaDataSchema = new mongoose.Schema({
  names: [{ type: String }],
  lastNames: [{ type: String }],
  nickName: { type: String },
  email: { type: String}
});

export default mongoose.model("MetaData", MetaDataSchema);

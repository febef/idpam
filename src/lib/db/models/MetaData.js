
import mongoose from 'mongoose'
import { tenantPlugin } from '../../demo/tenantPlugin.js'

const MetaDataSchema = new mongoose.Schema({
  names: [{ type: String }],
  lastNames: [{ type: String }],
  nickName: { type: String },
  email: { type: String}
});

MetaDataSchema.plugin(tenantPlugin);

export default mongoose.model("MetaData", MetaDataSchema);

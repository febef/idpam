import mongoose from 'mongoose'
import { tenantPlugin } from '../../demo/tenantPlugin.js'

const RolSchema = new mongoose.Schema({
  name: { type:String },
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }]
});

RolSchema.plugin(tenantPlugin);
RolSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export default mongoose.model("Role", RolSchema);

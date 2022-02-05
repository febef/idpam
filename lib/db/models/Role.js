import mongoose from 'mongoose'

const RolSchema = new mongoose.Schema({
  name: { type:String, unique: true },
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }]
});

export default mongoose.model("Role", RolSchema);

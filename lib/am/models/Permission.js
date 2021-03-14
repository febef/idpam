import mongoose from 'mongoose'

const PermissionSchema = new mongoose.Schema({
  className: [{ type: String }],
  targetObject: [{ type: String }],
  targetObjectIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Premission' }],
  domain: [{ type: String }],
  read: { type: Boolean },
  write: { type: Boolean },
  append: { type: Boolean },
  delete: { type: Boolean },
  execute: { type: Boolean }
});

export default mongoose.model("Permission", PermissionSchema);

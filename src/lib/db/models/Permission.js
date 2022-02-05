import mongoose from 'mongoose'

const PermissionSchema = new mongoose.Schema({
  targetObjects: [{ type: String }],
  domain: {type: String },
  verbs: [{ type:String}]
});

export default mongoose.model("Permission", PermissionSchema);

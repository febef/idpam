import mongoose from 'mongoose'
import { tenantPlugin } from '../../demo/tenantPlugin.js'

const PermissionSchema = new mongoose.Schema({
  targetObjects: [{ type: String }],
  domain: {type: String },
  verbs: [{ type:String}]
});

PermissionSchema.plugin(tenantPlugin);

export default mongoose.model("Permission", PermissionSchema);

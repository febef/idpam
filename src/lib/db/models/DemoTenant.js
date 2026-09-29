import mongoose from 'mongoose';

const DemoTenantSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, unique: true, immutable: true },
  adminCredentialId: { type: mongoose.Schema.Types.ObjectId, required: true },
  expiresAt: { type: Date, required: true, index: true }
}, { timestamps: true });

export default mongoose.model('DemoTenant', DemoTenantSchema);

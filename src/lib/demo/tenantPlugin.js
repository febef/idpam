import { currentTenantId } from './tenantContext.js';

const queryOperations = [
  'countDocuments', 'deleteMany', 'deleteOne', 'find', 'findOne',
  'findOneAndDelete', 'findOneAndReplace', 'findOneAndUpdate',
  'replaceOne', 'updateMany', 'updateOne'
];

// Every user-owned document carries an immutable tenant boundary. Query and
// document middleware make an omitted tenant fail closed instead of relying on
// each route author to remember a filter.
export function tenantPlugin(schema) {
  schema.add({
    tenantId: { type: String, required: true, immutable: true, index: true, select: false }
  });

  schema.set('toJSON', {
    transform: (document, result) => { delete result.tenantId; return result; }
  });
  schema.set('toObject', {
    transform: (document, result) => { delete result.tenantId; return result; }
  });

  schema.pre(queryOperations, function scopeQuery() {
    this.where({ tenantId: currentTenantId() });
    if (this.op.startsWith('find')) this.select('+tenantId');
  });

  schema.post(['find', 'findOne', 'findOneAndDelete', 'findOneAndReplace', 'findOneAndUpdate'],
    function hideLeanTenant(result) {
      for (const value of Array.isArray(result) ? result : [result]) {
        if (value && !(value.$__)) delete value.tenantId;
      }
    });

  schema.pre('validate', function scopeDocument() {
    const tenantId = currentTenantId();
    if (!this.tenantId) this.tenantId = tenantId;
    if (this.tenantId !== tenantId) throw new Error('Document crossed the demo tenant boundary');
  });
}

const verbs = new Set(['read', 'create', 'edit', 'append', 'delete', 'execute']);

export function normalizeRoleName(value) {
  if (typeof value !== 'string') throw new TypeError('Role name must be text');
  const name = value.trim();
  if (!/^[\p{L}\p{N}_ -]{2,60}$/u.test(name)) throw new TypeError('Invalid role name');
  return name;
}

export function normalizePermissionInput(input) {
  if (!input || typeof input !== 'object') throw new TypeError('Invalid permission');
  const targets = typeof input.targets === 'string'
    ? input.targets.split(',').map(value => value.trim()).filter(Boolean)
    : [];
  const actions = typeof input.verbs === 'string'
    ? input.verbs.split(',').map(value => value.trim()).filter(Boolean)
    : [];
  if (!targets.length || targets.length > 8 || !actions.length || actions.length > 6) {
    throw new TypeError('Targets and verbs are required');
  }
  if (targets.some(value => !/^[a-z][a-z0-9-]*:(?:\*|[a-zA-Z0-9_-]+)$/.test(value))) {
    throw new TypeError('Invalid target');
  }
  if (actions.some(value => !verbs.has(value))) throw new TypeError('Invalid verb');
  return { targetObjects: [...new Set(targets)], verbs: [...new Set(actions)], domain: 'demo' };
}

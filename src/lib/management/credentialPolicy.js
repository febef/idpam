function text(value, pattern, label) {
  if (typeof value !== 'string' || !pattern.test(value.trim())) {
    throw new TypeError(`Invalid ${label}`);
  }
  return value.trim();
}

export function normalizeSimpleCredentialInput(input, { creating = false } = {}) {
  if (!input || typeof input !== 'object') throw new TypeError('Invalid credential');
  const name = text(input.name, /^[\p{L}\p{N}_ .-]{2,60}$/u, 'credential name');
  const userfacade = creating
    ? text(input.userfacade, /^[a-zA-Z0-9._-]{3,40}$/, 'username')
    : undefined;
  const password = input.password || undefined;
  if ((creating || password) && (typeof password !== 'string' || password.length < 12 || password.length > 128)) {
    throw new TypeError('Password must contain 12–128 characters');
  }
  const roleIds = input.roleIds == null ? [] : Array.isArray(input.roleIds) ? input.roleIds : [input.roleIds];
  if (roleIds.length > 8 || roleIds.some(id => typeof id !== 'string' || !/^[a-f0-9]{24}$/i.test(id))) {
    throw new TypeError('Invalid role selection');
  }
  return { name, userfacade, password, roleIds: [...new Set(roleIds)], enabled: input.enabled === 'on' };
}

// Public demo edits are intentionally narrower than the legacy generic API.
export function normalizeDemoProfileInput(input) {
  const fields = ['nickName', 'names', 'lastNames', 'email'];
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Invalid profile');
  }
  if (Object.keys(input).some(key => !fields.includes(key))) {
    throw new TypeError('Unsupported profile field');
  }

  const profile = {};
  for (const field of fields) {
    if (typeof input[field] !== 'string') throw new TypeError(`${field} must be text`);
    const value = input[field].trim();
    if (value.length > (field === 'email' ? 120 : 60)) {
      throw new TypeError(`${field} is too long`);
    }
    profile[field] = value;
  }
  if (!profile.nickName) throw new TypeError('Nickname is required');
  if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
    throw new TypeError('Invalid email');
  }
  return profile;
}

// Preserve the legacy array UI's per-item semantics without exposing a model path.
export function updateDemoNameItems(current, change) {
  if (!Array.isArray(current) || current.some(value => typeof value !== 'string')) {
    throw new TypeError('Invalid metadata names');
  }
  if (!change || typeof change !== 'object' || Array.isArray(change)) {
    throw new TypeError('Invalid metadata operation');
  }

  if (change.operation === 'append') {
    if (typeof change.value !== 'string') throw new TypeError('Name must be text');
    const value = change.value.trim();
    if (!value || value.length > 60) throw new TypeError('Invalid name');
    return [...current, value];
  }

  if (change.operation === 'delete' || change.operation === 'replace') {
    if (!Number.isInteger(change.index) || change.index < 0 || change.index >= current.length) {
      throw new TypeError('Invalid name index');
    }
    if (change.operation === 'delete') {
      return current.filter((_, index) => index !== change.index);
    }
    if (typeof change.value !== 'string') throw new TypeError('Name must be text');
    const value = change.value.trim();
    if (!value || value.length > 60) throw new TypeError('Invalid name');
    return current.map((item, index) => index === change.index ? value : item);
  }

  throw new TypeError('Unsupported metadata operation');
}

export function replaceFirstDemoNameItem(current, value) {
  if (!Array.isArray(current) || current.some(item => typeof item !== 'string') ||
      typeof value !== 'string' || value.trim().length > 60) {
    throw new TypeError('Invalid metadata name');
  }
  const remaining = current.slice(1);
  const first = value.trim();
  return first ? [first, ...remaining] : remaining;
}

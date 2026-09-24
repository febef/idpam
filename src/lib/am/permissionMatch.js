// Authorization policy for docs/demo-contract.md; independent of HTTP and MongoDB.
// A matching verb never grants access unless the same permission matches target.

function matchesTarget(allowedTarget, target) {
  if (allowedTarget === '*') return true;
  if (allowedTarget === target) return true;

  if (allowedTarget.endsWith('*') && allowedTarget.indexOf('*') === allowedTarget.length - 1) {
    return target.startsWith(allowedTarget.slice(0, -1));
  }

  return false;
}

export function roleAllows(role, verb, target) {
  if (typeof verb !== 'string' || !verb || typeof target !== 'string' || !target) {
    return false;
  }

  if (!Array.isArray(role?.permissions)) return false;

  return role.permissions.some(permission => {
    if (!Array.isArray(permission?.verbs) || !permission.verbs.includes(verb)) {
      return false;
    }

    if (!Array.isArray(permission.targetObjects)) return false;

    return permission.targetObjects.some(allowedTarget =>
      typeof allowedTarget === 'string' && matchesTarget(allowedTarget, target)
    );
  });
}

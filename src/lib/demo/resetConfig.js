// Fail-closed target and schedule validation for docs/demo-contract.md.
// DropDatabase is permitted only on the disposable Compose or same-pod database.
export function demoResetConfig(uri, intervalValue) {
  let target;
  try {
    target = new URL(uri);
  } catch {
    throw new Error('Invalid demo database URI');
  }

  if (
    target.protocol !== 'mongodb:' ||
    !['mongo', '127.0.0.1'].includes(target.hostname) ||
    target.port !== '27017' ||
    target.pathname !== '/idpam_demo' ||
    target.username || target.password || target.search || target.hash
  ) {
    throw new Error('Reset is restricted to the disposable idpam_demo Mongo database');
  }

  const intervalSeconds = Number(intervalValue);
  if (!Number.isInteger(intervalSeconds) || intervalSeconds < 60 || intervalSeconds > 86400) {
    throw new Error('RESET_INTERVAL_SECONDS must be an integer from 60 to 86400');
  }

  return { intervalSeconds };
}

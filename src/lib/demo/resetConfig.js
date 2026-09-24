// Fail-closed target and schedule validation for docs/demo-contract.md.
// DropDatabase is permitted only on the Compose-local disposable database.
export function demoResetConfig(uri, intervalValue) {
  let target;
  try {
    target = new URL(uri);
  } catch {
    throw new Error('Invalid demo database URI');
  }

  if (
    target.protocol !== 'mongodb:' ||
    target.hostname !== 'mongo' ||
    target.port !== '27017' ||
    target.pathname !== '/idpam_demo' ||
    target.username || target.password || target.search || target.hash
  ) {
    throw new Error('Reset is restricted to mongodb://mongo:27017/idpam_demo');
  }

  const intervalSeconds = Number(intervalValue);
  if (!Number.isInteger(intervalSeconds) || intervalSeconds < 60 || intervalSeconds > 86400) {
    throw new Error('RESET_INTERVAL_SECONDS must be an integer from 60 to 86400');
  }

  return { intervalSeconds };
}

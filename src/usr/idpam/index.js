

import IdPAM from '../../lib/idpam/index.js'
import configs from '../../etc/index.js'
import { demoResetConfig } from '../../lib/demo/resetConfig.js'
import { removeExpiredTenants } from '../../lib/demo/tenantLifecycle.js'

const { intervalSeconds } = demoResetConfig(
  configs.database.uri,
  process.env.RESET_INTERVAL_SECONDS || '3600'
);
const idpam = new IdPAM(configs);

idpam.db.ready
  .then(async () => {
    idpam.serve();

    setInterval(async () => {
      try {
        const removed = await removeExpiredTenants(idpam.db.models);
        if (removed) console.log(`Removed ${removed} expired demo tenant(s).`);
      } catch (error) {
        console.error('Expired demo tenant cleanup failed:', error.message);
      }
    }, Math.min(intervalSeconds, 300) * 1000).unref();
  })
  .catch(error => {
    console.error('IdPAM failed to connect to its demo database:', error.message);
    process.exitCode = 1;
  });

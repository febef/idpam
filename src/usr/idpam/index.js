

import IdPAM from '../../lib/idpam/index.js'
import configs from '../../etc/index.js'
import { demoResetConfig } from '../../lib/demo/resetConfig.js'
import { resetAndSeedDemo } from '../../lib/demo/resetAndSeed.js'

const { intervalSeconds } = demoResetConfig(
  configs.database.uri,
  process.env.RESET_INTERVAL_SECONDS || '3600'
);
const demoPassword = process.env.IDPAM_DEMO_PASSWORD || 'demo-idpam-only-2026';
const idpam = new IdPAM(configs);

idpam.db.ready
  .then(async () => {
    await resetAndSeedDemo(idpam.db.models, configs.database.uri, intervalSeconds, demoPassword);
    idpam.serve();

    setInterval(async () => {
      idpam.demoResetting = true;
      try {
        await resetAndSeedDemo(idpam.db.models, configs.database.uri, intervalSeconds, demoPassword);
        await new Promise((resolve, reject) =>
          idpam.wAdmin.sessionStore.clear(error => error ? reject(error) : resolve())
        );
        console.log('Disposable demo data and sessions reset.');
      } catch (error) {
        console.error('Demo reset failed; stopping instead of serving stale state:', error.message);
        process.exit(1);
      } finally {
        idpam.demoResetting = false;
      }
    }, intervalSeconds * 1000).unref();
  })
  .catch(error => {
    console.error('IdPAM failed to connect to its demo database:', error.message);
    process.exitCode = 1;
  });



import IdPAM from '../../lib/idpam'
import configs from '../../etc'

let idpam = new IdPAM(configs);

idpam.serve();


import eServer from '../eserver'
import DB from '../db'
import AM from '../am'
import IdP from '../idp'
import wAdmin from '../wadmin'
export default class IdPAM extends eServer {

  constructor ({server, database, idp, am, wadmin=true}) {
    super(server)
    this.db = new DB(database);
    this.idp = new IdP(idp);
    this.am = new AM();
    if (wadmin) this.wAdmin = new wAdmin(this);


    /*this.idp.CreateIdentity({
      credentials: {
        simple: {userfacade: "febef", password: "[removed from public history]", name: "main"}
      },
      metadata: {
        nickName: "febef"
      }
    });
    */
  }

}




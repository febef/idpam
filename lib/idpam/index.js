
import eServer from '../eserver'
import DB from '../db'
import AM from '../am'
import IdP from '../idp'

export default class IdPMA extends eServer {

  constructor ({server, database, idp, am}) {
    super(server)
    this.db = new DB(database);
    this.idp = new IdP(idp);
    this.am = new AM();

  }

}




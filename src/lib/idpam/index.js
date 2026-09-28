
import eServer from '../eserver/index.js'
import DB from '../db/index.js'
import AM from '../am/index.js'
import IdP from '../idp/index.js'
import API from '../api/index.js'
import wAdmin from '../wadmin/index.js'

import mongoose from 'mongoose'
import Identity from '../db/models/Identity.js'

const ObjectId = mongoose.Types.ObjectId;

export default class IdPAM extends eServer {

  constructor ({server, database, idp, am, wadmin=true}) {
    super(server)
    this.db = new DB(database);
    this.idp = new IdP(idp, this);
    this.am = new AM(am, this);
    this.api = new API(this);
    if (wadmin) this.wAdmin = new wAdmin(this, wadmin);
  }
}

IdPAM.prototype.getIdFromCredential = async function(credential) {
  return await Identity
    .findOne({ $or: [{
      "credentials.ldapcredentials": new ObjectId(credential._id)
    },{
      "credentials.sshkeycredentials": new ObjectId(credential._id)
    },{
      "credentials.simplecredentials": new ObjectId(credential._id)
    },{
      "credentials.tokencredentials": new ObjectId(credential._id)
    }]})
    .populate([
      'metadatas',
      { path : 'credentials.ldapcredentials'  , populate : { path : 'roles'} },
      { path : 'credentials.sshkeycredentials', populate : { path : 'roles'} },
      { path : 'credentials.simplecredentials', populate : { path : 'roles'} },
      { path : 'credentials.simplecredentials', populate : { path : 'roles'} },
      { path : 'credentials.tokencredentials' , populate : { path : 'roles'} }
    ])
    .exec();
};

IdPAM.prototype.getCredential = async function(id) {
  for (let model in this.db.models) if (model.indexOf("credential")>-1) {
    let credential = await this.db.models[model]
      .findOne({ "_id": id })
    //  .populate(['roles'])
      .exec();
    if (credential) return credential;
  }
  return null;
};


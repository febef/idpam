
import eServer from '../eserver'
import DB from '../db'
import AM from '../am'
import IdP from '../idp'
import API from '../api'
import wAdmin from '../wadmin'

import mongoose from 'mongoose'
import Identity from '../db/models/Identity'

const ObjectId = mongoose.Types.ObjectId;

export default class IdPAM extends eServer {

  constructor ({server, database, idp, am, wadmin=true}) {
    super(server)
    this.db = new DB(database);
    this.idp = new IdP(idp, this);
    this.am = new AM(am, this);
    this.api = new API(this);
    if (wadmin) this.wAdmin = new wAdmin(this);


    /* /
    let permission = this.am.createPermission({
      name: 'sadmin',
      targetObjects: '*',
      verbs: ['read', 'edit', 'append', 'delete', 'execute']
    });

    let role = this.am.createRol('admin', [ObjectId(permission._id)]);

    let id = this.idp.CreateIdentity({
      credentials: {
        simplecredentials: [{
          name: "main",
          userfacade: "febef",
          password: "[removed from public history]",
          enabled: true,
          expiration: 0,
          roles: [ObjectId(role._id)]
        }]
      },
      metadatas: {
        nickName: "febef"
      }
    });

    /**/
  }
}

IdPAM.prototype.getIdFromCredential = async function(credential) {
  return await Identity
    .findOne({ $or: [{
      "credentials.ldapcredentials": ObjectId(credential._id)
    },{
      "credentials.sshkeycredentials": ObjectId(credential._id)
    },{
      "credentials.simplecredentials": ObjectId(credential._id)
    },{
      "credentials.tokencredentials": ObjectId(credential._id)
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





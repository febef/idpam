import mongoose from 'mongoose'
import Identity from './models/Identity.js'
import MetaData from './models/MetaData.js'
import Permission from './models/Permission.js'
import Role from './models/Role.js'
import SimpleCredential from './models/SimpleCredential/index.js'
import TokenCredential from './models/TokenCredential/index.js'
import SSHKeyCredential from './models/SSHKeyCredential/index.js'
import LDAPCredential from './models/LDAPCreadential/index.js'

export default class DB {
  constructor(config) {
    this.uri = config.uri;
    this.mongoose = mongoose;
    this._setup();
    this.ready = this._connect();
    this.ObjectId = mongoose.Types.ObjectId;
  }
}

DB.prototype._setup =  function() {
  this.mongoose.connection.once('open', this.onOpenConnection );
  this.mongoose.connection.on('error', this.onError);
  this._addModels();
}

DB.prototype._addModels = function() {
  this.models = {
    identity: Identity,
    metadata: MetaData,
    permission: Permission,
    role: Role,
    simplecredential: SimpleCredential,
    tokencredential: TokenCredential,
    sshkeycredential: SSHKeyCredential,
    ldapcredential: LDAPCredential
  };
};

DB.prototype.onError = function() {
  console.error("mongoDB connection error");
}

DB.prototype.onOpenConnection = function() {
  console.log("mongoDB connected.");
}

DB.prototype._connect = function() {
  return this.mongoose.connect(this.uri, { serverSelectionTimeoutMS: 5000 });
}

import fs from 'fs'
import path from 'path'

import mongoose from 'mongoose'

import Identity from './models/Identity.js'
import MetaData from './models/IdMetaData'

const ObjectId =  mongoose.Types.ObjectId;

export default class IdP {

  constructor(configs) {

    this.credentialsClass = {};
    this.configs = configs;
    this._loadCredentialsClasses();

  }
}


IdP.prototype.CreateIdentity = function({
  domain=false, type='user',
  credentials=false,
  metadata=false
}) {

  const newId = new Identity();

  newId.type = type;
  newId.domain = domain ? domain : this.domain;
  newId.credentials = {};

  if (credentials)
    this.createCredentials(credentials, newId);

  if (metadata)
    this._createMetadata(metadata, newId);

  newId.save(err => {
    if (!err) console.log(`  » Las credenciales se guardaron exitosamente.`);
    else console.log(`E!» Error al guardar las credenciales.`);
  });
};

IdP.prototype._loadCredentialsClasses = function() {
  const files = fs.readdirSync(path.join(__dirname, 'models'));

  for(let file of files) if ( file.indexOf('Credential.js') > -1 ) {
    const credentialClass = require(path.join(__dirname, 'models', file)).default;
    const className = file
      .slice(0, -("Credential.js".length))
      .toLowerCase();
    credentialClass.configure(this.configs);
    console.log("  » Load & configure auth class:", className);
    if (!this.credentialsClass) this.credentialsClass = {};
    this.credentialsClass[className] = credentialClass;
  }
};

IdP.prototype._createMetadata = function(metadata, identity) {

  const md = new MetaData(metadata);
  md.save();
  identity.metadata = md.id;

};

IdP.prototype.createCredentials = function(credentials, identity) {
  let credentialConfig = {};

  for (let credentialType in credentials) { if (this.credentialsClass[credentialType]) {
    const credential = new this.credentialsClass[credentialType](credentials[credentialType]);
    if (!identity.credentials) identity.credentials = {}
    if (!identity.credentials[credentialType]) identity.credentials[credentialType] = [];
    identity.credentials[credentialType].push(credential.id);
    credential.save();
  //  console.log(`  » La credencial '${credentialType}' fue agregada.`);
  }}
  //else {
  //  console.log(`! » La credencial '${credentialType}' no fue encontrada.`);
  //}}

};


IdP.prototype.inferAuthClasses = function(authData) {
  let authClasses = [];

  for (let className in this.credentialsClass){
    if (this.credentialsClass[className].verifyMethod(authData)) {
      authClasses.push(className);
      console.log("[IDP] authClassName: ", className, "  MATCH!");
    } /*else {
      console.log("[IDP] authClassName: ", className, "  notmacth");
    }*/
  }
  return authClasses;
}

IdP.prototype.Authenticate = function(authData) {
  const authClassNames = this.inferAuthClasses(authData);
  let auth = null;

  for (let authClassName of authClassNames) {
    auth = this.credentialsClass[authClassName].authenticate(authData);
    if (auth) break;
    //      console.log("[IDP] authClassName: ", authClassName, "  Authenticated!");
  }

  return auth;
};

IdP.prototype.getIdFromCredential = async function(credential) {
  return await Identity
    .findOne({ $or: [{
      "credentials.ldap": ObjectId(credential._id)
    },{
      "credentials.sshkey": ObjectId(credential._id)
    },{
      "credentials.simple": ObjectId(credential._id)
    },{
      "credentials.token": ObjectId(credential._id)
    }]})
    .populate([
      'metadata',
      'credentials.ldap',
      'credentials.sshkey',
      'credentials.simple',
      'credentials.token'
    ])
    .exec();
};

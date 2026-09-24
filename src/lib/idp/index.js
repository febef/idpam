
import mongoose from 'mongoose'

import Identity from '../db/models/Identity.js'
import MetaData from '../db/models/MetaData.js'

const ObjectId =  mongoose.Types.ObjectId;

export default class IdP {

  constructor(configs, idpam) {

    this.credentialsClass = {};
    this.configs = configs;
    this.models = idpam.db.models;
    this._setupCredentialsClasses();

  }
}

IdP.prototype.CreateIdentity = function({
  domain=false, type='user',
  credentials=false,
  metadatas=false
}) {
  const newId = new Identity();

  newId.type = type;
  newId.domain = domain ? domain : this.domain;
  newId.credentials = {};

  if (credentials)
    this.createCredentials(credentials, newId);

  if (metadatas)
    this._createMetadata(metadatas, newId);

  newId.save(err => {
    if (!err) console.log(`  » Las credenciales se guardaron exitosamente.`);
    else console.log(`E!» Error al guardar las credenciales.`);
  });
};

IdP.prototype._setupCredentialsClasses = function() {
  for(let modelName in this.models) {
    if ( modelName.indexOf('credential') > -1 ) {
      this.credentialsClass[modelName] = this.models[modelName]
      this.credentialsClass[modelName].configure(this.configs);
      console.log("  » Configure auth class:", modelName);
    }
  }
};

IdP.prototype._createMetadata = function(metadatas, identity) {
  const md = new MetaData(metadatas);
  md.save();
  identity.metadatas = md.id;
};

IdP.prototype.createCredentials = function(credentials, identity) {
  let credentialConfig = {};

  for (let credentialName in credentials) { 
    
    const credentialType = credentialName.slice(0,-1);
    if (this.models[credentialType]) {
      for (let newCredential of credentials[credentialName]) {
        
        const credential = new this
          .credentialsClass[credentialType](newCredential);
        credential.save();
        
        if (!identity.credentials)
          identity.credentials = {};
        if (!(identity.credentials[credentialName]))
          identity.credentials[credentialName] = [];

        identity.credentials[credentialName].push(credential.id);

        console.log(
          '» La credencial ', credentialType, ':',
          credential.id, ' fue agregada.'
        );
      }
      
    }else {
      console.log(`! » La credencial '${credentialType}' no fue encontrada.`);
    }
  }
};

IdP.prototype.inferAuthClasses = function(authData) {
  let authClasses = [];

  for (let className in this.models){
    let model = this.models[className];
    if ( model.verifyMethod && model.verifyMethod(authData)) {
      console.log("[IDP] authClassName: ", className, "MATCH");
      authClasses.push(className);
    } /*else {
      console.log("[IDP] authClassName: ", className, "  notmacth");
    }*/
  }
  return authClasses;
}

IdP.prototype.Authenticate = async function(authData) {
  const authClassNames = this.inferAuthClasses(authData);
  let auth = null;

  for (let authClassName of authClassNames) {
    auth = await this.models[authClassName].authenticate(authData);
    if (auth) console.log("[IDP] authClassName: ", authClassName, "  Authenticated!");
    if (auth) break;
  }
  return auth;
};

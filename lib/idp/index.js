
import Identity from './models/Identity.js'

import SimpleCredential from './models/SimpleCredential.js'

export default class IdP {
  constructor() {

  }
}


IdP.prototype.CreateIdentity = function({
  domain=false, type='user',
  credentials=false,
  metaData=false
}) {

  const newId = new Identity();

  newId.type = type;

  newId.domain = domain ? domain : this.domain;

  newId.credentials = [];

  if (credentials)
    this._createCredentials(credentials);

  if (metaData)
    this._createMetadata(metaData);


  newId.save();
};

IdP.prototype._createMetadata = function(metadata) {

}

IdP.prototype._createCredentials = function(credencials) {

  for (let credential of credentials) {
    switch (credential) {
      case 'simple':
        const credential = credencials[credencial];

        break;
      default:
        console.log(`!» La credencial '${credential}' no fue encontrada.`)
    }
  }

};


IdP.prototype.Authenticate = function({}) {

};

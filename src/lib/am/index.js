
import mongoose from 'mongoose'
import Permission from '../db/models/Permission.js'
import Rol from '../db/models/Role.js'

import Identity from '../db/models/Identity.js'
import { roleAllows } from './permissionMatch.js'

const ObjectId =  mongoose.Types.ObjectId;

export default class AM {
  constructor(configs, idpam) {
    this.idpam = idpam;
  }
}

AM.prototype.createPermission = function(permission) {
  let newPermission = new Permission(permission);
  newPermission.save();
  return newPermission;
};

AM.prototype.createRol = function(name, permision_ids) {
  const rol = new Rol({
    name, permissions: permision_ids.map(id => new ObjectId(id))
  });
  rol.save();
  return rol;
};

AM.prototype.sessionVerifyAccess = async function({target, verb}, session) {
  const credential = await this.idpam.getCredential(session.user.credentialId);
  if (!credential){console.log("[AM] no session!"); return false;}
  return this.verifyAccess(credential, verb, target)
};

AM.prototype.verifyAccess = async function(credential, verb, target) {
  let allow = false;
  if (!credential.roles || credential.roles.length == 0) return allow;
  
  try {

    let roles, rolIdList = credential.roles;

    const query = { $or : rolIdList.map(id => ({_id: new ObjectId(id)}) ) };
    roles = await Rol.find(query).populate('permissions').exec();
    
    for (let rol in roles) {
      if(this.verifyRolAccess(verb, target, roles[rol])) {
        allow = true;
        break;
      }
    }
    console.log("[AM]:", {allow, verb, target});
  }catch (e) {
    console.log(e);
  }
  return allow
};

AM.prototype.verifyRolAccess = function(verb, target, rol) {
  return roleAllows(rol, verb, target);
}

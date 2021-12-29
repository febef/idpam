
import mongoose from 'mongoose'
import Permission from '../db/models/Permission'
import Rol from '../db/models/Role'

import Identity from '../db/models/Identity'

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
    name, permissions: permision_ids.map(id => ObjectId(id))
  });
  rol.save();
  return rol;
};

AM.prototype.sesionVerifyAccess = async function({target, verb}, session) {
  const credential = await this.idpam.getCredential(session.user.credentialId);
  if (!credential){console.log("[AM] no session!"); return false;}
  return this.verifyAccess(credential, verb, target)
};

AM.prototype.verifyAccess = async function(credential, verb, target) {
  let allow = false;
  let roles, rolIdList = credential.roles;

  const query = { $or : rolIdList.map(id => ({_id: ObjectId(id)}) ) };
  roles = await Rol.find(query).populate('permissions').exec();
 
  for (let rol in roles) {
    if(this.verifyRolAccess(verb, target, roles[rol])) {
      allow = true;
      break;
    }
  }
  console.log("[AM]:", {allow, verb, target});
  return allow
};

AM.prototype.verifyRolAccess = function(verb, target, rol) {
  for (let permission of rol.permissions) {
    for (let permitedTarget of permission.targetObjects) {
      let asteriskpos = permitedTarget.indexOf("*");
      if (
        (
          permitedTarget == "*" ||
          permitedTarget == target ||
          permitedTarget == target.slice(0, asteriskpos) + "*"
        ) &&
          permission.verbs.includes(verb) ||
          (verb.indexOf("#")==0 && permission.verbs.includes("execute"))
      ) {
        return true;
      }
    }
  }

  return false;
}

export default class API {
  constructor(idpam) {
    this.idpam = idpam;
  }
};

API.prototype.localRequest = async function(
  {target, verb, newVal, oldVal }, session
 ) {
  const allow = await this.idpam.am.sessionVerifyAccess(
    { target, verb }, session
  );
  if (allow == false)
    return { target, verb, success: false, code: 401 };

  return this.nativeRequest({target, verb, newVal, oldVal, session });
};

API.prototype.nativeRequest = async function(
  {verb, target, oldVal, newVal, session }
 ) {
  if (target[0]=='#')
    return this.nativeFunctionRequest({target, verb, newVal, oldVal, session});

  return this.nativeDBRequest({target, verb, newVal, oldVal, session });
};

API.prototype.nativeFunctionRequest = async function(
  {verb, target, oldVal, newVal }
 ) {
  const response = { success: true, verb };
  const functionName = target.slice(1);
  try {
    response.value = await this[functionName](oldVal, newVal);
  } catch (err) {
    response.success = false;
  }

  return response;
};

API.prototype.getFrontEndClass = async function(className, nullvar) {
  return this.idpam.db.models[className].getFrontEndClass();
};

API.prototype.getListOfDocs = async function(modelname){
  console.log('modn:', modelname);
  return await this.idpam.db.models[modelname].find().exec();
};

API.prototype.nativeDBRequest = async function(
  {verb, target, oldVal, newVal, session }
  ) {
    const response = { success: true, verb };
    let model, prop, targetPath;
    
  try {
    
    if (verb == 'create') {
      let credential = {...newVal};
      let identity = await this.idpam.getIdFromCredential({
        _id: session.user.credentialId
      });

      const model = new this.idpam.db.models[target](credential);
      let saved = await model.save();

      identity.credentials[target+'s'] = [...identity.credentials[target+'s'], new this.idpam.db.ObjectId(model._id) ];
      saved =  await identity.save();
      
      response.value =  model;
      return response;
    }

    model = await this._getModel(target);
    if (target.indexOf('/')!==-1) {
      targetPath = target.split('/')[1].split('.');
      prop = this._getProperty(model, targetPath);
    }

    const getProp = () => prop.path[prop.last];
    const setProp = (value) => prop.path[prop.last] = value;
    const setArray = (value, append=false) => {
      let array = this._getProperty(model, targetPath.slice(0,-1));
      let newArray = [];
  
      for (let k in array.path[array.last])
        newArray.push((k==prop.last)? newVal : array.path[array.last][k]);
  
      if(append) newArray.push(value);
  
      array.path[array.last] = newArray;
    };
    const rmItemArray = (index) => {
      let array = this._getProperty(model, targetPath.slice(0,-1));
      let newArray = [];
  
      for (let k in array.path[array.last]) if (k!=index)
        newArray.push(array.path[array.last][k]);
  
      array.path[array.last] = newArray;
    }; 

    if (
      verb=="append" &&
      getProp().constructor.name == 'CoreMongooseArray'
     ) {
      const length = getProp().length;
      targetPath = [...targetPath, length];
      prop = this._getProperty(model, targetPath);
    }

    if (oldVal && oldVal != getProp())
      response.differs = true;

    if (verb == "edit" || verb == "append") {
      if (prop.path.constructor.name == 'CoreMongooseArray') {
        setArray(newVal, verb=="append");
      } else {
        setProp(newVal);
      }
      model = await model.save()
      console.log("append:", model);
      prop = this._getProperty(model, targetPath);
    }
    
    if(verb == "delete" ) if (target.indexOf('/')==-1) {
      response.isObject = true;
      response.value = await this._deleteDocument(target);
      response.success = true;
    } else if(prop.path.constructor.name == 'CoreMongooseArray') {
      rmItemArray(prop.last)
      model = await model.save()
      prop = this._getProperty(model, targetPath);
      response.arraylength = prop.path.length;
    }

    if (prop) response.value = getProp()
  } catch (err) {
    console.log(err);
    response.success = false;
  }
  return response;
};

API.prototype._getProperty = function(model, targetPath) {
  let path = model, last;

  for (let step of targetPath.slice(0, targetPath.length-1)) {
    path = path[step];
  }

  last = targetPath.slice(-1)[0];

  return {
    path,
    last
  };
};

API.prototype._getModel = async function(target) {
  const [modelName, right] = target.split(':');
  const id = right.split('/')[0];
  return await this.idpam.db.models[modelName].findById(id).exec();
};

API.prototype._deleteDocument = async function(target){
  const [modelName, right] = target.split(':');
  const _id = right.split('/')[0];
    console.log("delete ID:"+_id);
    let rest = await this.idpam.db.models[modelName]
     .deleteOne({_id })
      .then(function(){
        return true;
      })
      .catch(function(error){
        console.log(error);
        return false;
      });
    //let>
};

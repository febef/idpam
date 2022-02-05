import fs from 'fs'
import path from 'path'

import mongoose from 'mongoose'

export default class DB {
  constructor(config) {
    const props = ['user', 'password', 'host', 'port', 'dbName']
    props.forEach( p => this[p] = config[p] );
    this.mongoose = mongoose;
    this._setup();
    this._connect();
    this.ObjectId = mongoose.Types.ObjectId;
  }
}

DB.prototype._setup =  function() {
  this.mongoose.connection.once('open', this.onOpenConnection );
  this.mongoose.connection.on('error', this.onError);
  this._addModels();
}

DB.prototype._addModels = function() {
  const files = fs.readdirSync(path.join(__dirname, 'models'));

  for(let file of files) if ( file[0]!='.') {
    const model = require(path.join(__dirname, 'models', file)).default;
    const modelName = file
      .slice(0, (file.indexOf(".js")>0)? -(".js".length) : file.length)
      .toLowerCase();
    console.log("  » Load model:", modelName);
    if (!this.models) this.models = {};
    this.models[modelName] = model;
  }
};

DB.prototype.onError = function() {
  console.error("mongoDB connection error");
}

DB.prototype.onOpenConnection = function() {
  console.log("mongoDB connected.");
}

DB.prototype._connect = function() {
  const connectionString =
    "mongodb://" + this.user + ":" + this.password + "@" 
    + this.host + ":" + this.port + "/" + this.dbName 
    +"?retryWrites=true&w=majority&authSource=admin";
    
  this.mongoose.connect( connectionString, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
}

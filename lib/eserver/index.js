import express      from 'express'
import bodyParser   from 'body-parser'
import cookieParser from 'cookie-parser'
import logger       from 'morgan'
//import csrf         from 'csurf'
import hpp          from 'hpp'
import xssClean     from 'xss-clean'
import helmet       from 'helmet'
import compression  from 'compression'

import path        from 'path'

export default class eServer {
  constructor({port, host, logger}) {

    this.expres = express;
    this.port = port;
    this.host = host;
    this.logger = logger;
    this._setup();
  }
}

eServer.prototype._setup = function() {
  this.app = this.expres();

  this.app.disable('x-powered-by');
  this.app.use(cookieParser());
  this.app.use(bodyParser.urlencoded({ extended: false }));
  this.app.use(logger(this.logger));
  this.app.use(this.expres.json({limit: '500kb'}));
  this.app.use(compression());
  this.app.use(helmet());
  this.app.use(xssClean());
  this.app.use(hpp());

};

eServer.prototype.serve = function() {
  this.app.listen(this.port, () => {
    console.log("Server listen on port", this.port);
  });
};

import ExpressSession from 'express-session'
import mongoose from 'mongoose'
import { fileURLToPath } from 'url'

export default class wAdmin {

  constructor(idpam, config) {

    this.idpam = idpam;
    this.app = idpam.app;
    this.config = config;

    this._createRoutes();
    this._configServer();
  }

}


wAdmin.prototype._configServer = function () {

  const use = this.app.use.bind(this.app);
  const set = this.app.set.bind(this.app);

  this.sessionStore = new ExpressSession.MemoryStore();
  this.eSession = new ExpressSession({
    secret: this.config.sessionSecret,
    store: this.sessionStore,
    saveUninitialized: false,
    resave: false,
    cookie: { httpOnly: true, sameSite: 'lax' }
  });
  /*{
    secret: 'wadminsecret!shh',
    // Create new redis store. 
    // ⇒ https://codeforgeek.com/manage-session-using-node-js-express-4/
    store: new redisStore({
      host: 'localhost',
      port: 6379,
      client: client,
      ttl : 260
    }),
    saveUninitialized: false,
    resave: false
  });*/

  set("view engine", "pug");
  set("views", fileURLToPath(new URL('../../usr/views/pages/', import.meta.url)));

  use(
    '/assets',
    this.idpam.express.static(fileURLToPath(new URL('../../usr/assets/', import.meta.url)))
  );
  use(this.eSession);
  use((req, res, next) => {
    if (this.idpam.demoResetting) return res.status(503).send('Demo data is resetting');
    next();
  });
  use('/', this.router);

};

wAdmin.prototype._createRoutes = function () {

  this.router = this.idpam.express.Router();

  const use = this.app.use.bind(this.app);
  const get = this.router.get.bind(this.router);
  const post = this.router.post.bind(this.router);

  const isaAuth = this.ifSessionActiveAutorice.bind(this);
  const idpAuth = this.idpam.idp.Authenticate.bind(this.idpam.idp);
  const getId = this.idpam.getIdFromCredential.bind(this.idpam);

  use((req, res, next) => {
    res.sendScript = (script) => {
      res.type('js');
      res.send(script);
    };
    next();
  });

  get("/login", (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render("login", { pageTitle: 'login', theme: "dark-theme", demoReadOnly: false });
  });

  post('/login', async (req, res) => {
    const credential = await idpAuth(req.body)
    if (credential != null) {
      await new Promise((resolve, reject) =>
        req.session.regenerate(error => error ? reject(error) : resolve())
      );
      if (!await this._setUser(credential, req)) return res.redirect('/login');
      res.redirect('/');
    } else {
      res.redirect('/login');
    }

  });

  get('/logout', isaAuth, (req, res) => {
    req.session.destroy();
    res.redirect('/login');
  });

  get('/:page?', isaAuth, async (req, res) => {
    let page = 'home'
    let list = [];
    const id = await getId({ _id: req.session.user.credentialId });
    const getSchemas = () => {
      let collections = mongoose.connections[0].collections;
      let names = [];
      Object.keys(collections).forEach(function (k) { names.push(k); });
      return names;
    }

    if (req.params.page) {
      page = req.params.page;

      switch(req.params.page) {
        case "roles": list = await this.idpam.db.models.role.find() ; break;
        case "identities": list = await this.idpam.db.models.identity.find(); break;
        default: page='home';
      }

    }

    res.render(page, {
      pageTitle: page,
      theme:"dark-theme",
      demoReadOnly: req.session.user.credentialName === 'demo',
      user: req.session.user,
      id,
      ots: JSON.stringify,
      getSchemas,
      list 
    });

  });

  post('/lapi', isaAuth, async (req, res) => {
    res.json(await this.lapi(req.body, req));
  });

  get('/lapi/:verb/:target/:oldVal/:newVal?', isaAuth, async (req, res) => {
    const apires = await this.lapi(req.params, req);
    if (req.params.newVal == 'file') {
      res.type('.js');
      return res.send(apires.value);
    }
    res.json(apires);
  });

  // Error Handling not found
  get('*', isaAuth, (req, res) => {
    res.redirect('/');
  });

  // Error Handling others
  use((err, req, res, next) => {
    console.log(err);
    next();
  });

};

wAdmin.prototype._setUser = async function(credential, req) {
  const id = await this.idpam.getIdFromCredential(credential);
  if (!id || !id.metadatas) return false;
  req.session.user = {
    nickName: id.metadatas.nickName,
    domain: id.domain,
    credentialName: credential.name,
    credentialId: credential._id
  };
  return true;
};

wAdmin.prototype.lapi = async function ({target, verb, oldVal, newVal}, req) {
  return await this.idpam.api.localRequest(
    { target, verb, oldVal, newVal }, req.session
  );
};

wAdmin.prototype.ifSessionActiveAutorice = async function (req, res, next) {
  if (!req.session.user) return res.redirect('/login')
  if (!await this._setUser({ _id: req.session.user.credentialId, name: req.session.user.credentialName}, req)) {
    req.session.destroy(() => {});
    return res.redirect('/login');
  }
  next();
}

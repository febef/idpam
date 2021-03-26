import path from 'path'
import ExpressSession from 'express-session'

export default class wAdmin {

  constructor(idpam) {

    this.idpam = idpam;
    this.app = idpam.app;

    this._createRoutes();
    this._configServer();
  }

}


wAdmin.prototype._configServer = function () {

  const use = this.app.use.bind(this.app);
  const set = this.app.set.bind(this.app);

  this.eSession = new ExpressSession({ secret: 'ssshhhhh', saveUninitialized: true, resave: true });
  /*{
  secret: 'wadminsecret!shh',
  // create new redis store. ⇒ https://codeforgeek.com/manage-session-using-node-js-express-4/
  // store: new redisStore({ host: 'localhost', port: 6379, client: client,ttl : 260}),
  saveUninitialized: false,
  resave: false
});*/

  set("view engine", "pug");
  set("views", path.join(__dirname, '../../usr/views/pages'));

  use(
    '/assets',
    this.idpam.express.static(path.join(__dirname, '../../usr/assets'))
  );
  use(this.eSession);
  use('/', this.router);

};

wAdmin.prototype._createRoutes = function () {

  this.router = this.idpam.express.Router();

  const use = this.app.use.bind(this.app);
  const get = this.router.get.bind(this.router);
  const post = this.router.post.bind(this.router);

  const isaAuth = this.ifSessionActiveAutoreice.bind(this);
  const idpAuth = this.idpam.idp.Authenticate.bind(this.idpam.idp);
  const getId = this.idpam.idp.getIdFromCredential.bind(this.idpam.idp);

  get("/login", (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render("login", { pageTitle: 'login' });
  });

  post('/login', async (req, res) => {
    const credential = await idpAuth(req.body)

    if (credential != null) {
      const id = await getId(credential);
      console.log(id);
      req.session.user = {metadata: id.metadata, domain: id.domain, credentials: id.credentials };
      res.redirect('/');
      //res.json({success: true});
    } else {
      res.redirect('/login');
    }

  });

  get('/logout', isaAuth, (req, res) => {
    req.session.destroy();
    res.redirect('/login');
  });

  get('/', isaAuth, (req, res) => {
    console.log("SESION:", req.session)
    res.render('home', { pageTitle: "home", user: req.session.user, ots: JSON.stringify });
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

wAdmin.prototype.ifSessionActiveAutoreice = function ( req, res, next) {
  if (!req.session.user) return res.redirect('/login')
  next();
}

import ExpressSession from 'express-session'
import mongoose from 'mongoose'
import { fileURLToPath } from 'url'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import { normalizeDemoProfileInput, replaceFirstDemoNameItem } from '../demo/profilePolicy.js'
import { registerManagementRoutes } from '../management/routes.js'
import { isDemoAdmin } from '../management/adminAccess.js'
import { issueSshChallenge, verifySshProof } from '../management/sshProof.js'
import { getOidcConfig, oidc, redirectUri } from '../oidc/client.js'

function verifyDemoCsrf(req) {
  const expected = req.session.demoCsrf;
  const supplied = req.body?.csrfToken;
  return typeof expected === 'string' && typeof supplied === 'string' &&
    expected.length === supplied.length &&
    timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
}

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

  use((req, res, next) => {
    res.sendScript = (script) => {
      res.type('js');
      res.send(script);
    };
    next();
  });

  get("/login", (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render("login", { pageTitle: 'login', theme: "dark-theme", demoReadOnly: false,
      demoHint: !process.env.IDPAM_DEMO_PASSWORD });
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

  post('/login/ssh/challenge', async (req, res) => {
    const credentialId = req.body?.credentialId;
    if (!mongoose.isValidObjectId(credentialId)) return res.sendStatus(400);
    const credential = await this.idpam.db.models.sshkeycredential.findOne({ _id: credentialId, enabled: true });
    if (!credential) return res.sendStatus(404);
    const challenge = issueSshChallenge();
    req.session.sshChallenge = { credentialId, challenge, expiresAt: Date.now() + 120_000 };
    res.set('Cache-Control', 'no-store');
    return res.json({ challenge, message: `idpam-demo-ssh-v1:${challenge}` });
  });

  post('/login/ssh/verify', async (req, res) => {
    const pending = req.session.sshChallenge;
    delete req.session.sshChallenge; // consume once, including invalid attempts
    if (!pending || pending.expiresAt < Date.now() ||
        pending.credentialId !== req.body?.credentialId) return res.redirect('/login');
    const credential = await this.idpam.db.models.sshkeycredential.findOne({ _id: pending.credentialId, enabled: true });
    if (!credential) return res.redirect('/login');
    let valid = false;
    try { valid = verifySshProof(credential.publicKey, pending.challenge, req.body?.signature); }
    catch { valid = false; }
    if (!valid) return res.redirect('/login');
    await new Promise((resolve, reject) =>
      req.session.regenerate(error => error ? reject(error) : resolve())
    );
    if (!await this._setUser(credential, req)) return res.redirect('/login');
    return res.redirect('/');
  });

  get('/oidc/login', async (req, res, next) => {
    try {
      const config = await getOidcConfig();
      const verifier = oidc.randomPKCECodeVerifier();
      const challenge = await oidc.calculatePKCECodeChallenge(verifier);
      const state = oidc.randomState();
      const nonce = oidc.randomNonce();
      req.session.oidcPending = { verifier, state, nonce, expiresAt: Date.now() + 300_000 };
      const destination = oidc.buildAuthorizationUrl(config, {
        redirect_uri: redirectUri, scope: 'openid email profile',
        code_challenge: challenge, code_challenge_method: 'S256', state, nonce
      });
      return res.redirect(destination.href);
    } catch (error) { next(error); }
  });

  get('/oidc/callback', async (req, res) => {
    const pending = req.session.oidcPending;
    delete req.session.oidcPending;
    if (!pending || pending.expiresAt < Date.now()) return res.redirect('/login');
    try {
      const config = await getOidcConfig();
      const tokens = await oidc.authorizationCodeGrant(
        config, new URL(req.originalUrl, 'http://127.0.0.1:3000'),
        { pkceCodeVerifier: pending.verifier, expectedState: pending.state,
          expectedNonce: pending.nonce, idTokenExpected: true }
      );
      const claims = tokens.claims();
      if (claims?.iss !== 'http://127.0.0.1:5556/dex' ||
          typeof claims.email !== 'string' || !claims.sub) return res.redirect('/login');
      const credential = await this.idpam.db.models.ldapcredential.findOne({
        issuer: claims.iss, email: claims.email.toLowerCase(), enabled: true
      });
      if (!credential) return res.redirect('/login');
      await new Promise((resolve, reject) =>
        req.session.regenerate(error => error ? reject(error) : resolve())
      );
      if (!await this._setUser(credential, req)) return res.redirect('/login');
      return res.redirect('/');
    } catch {
      // Provider errors and invalid assertions fail closed without disclosing tokens.
      return res.redirect('/login');
    }
  });

  post('/logout', isaAuth, (req, res) => {
    if (!verifyDemoCsrf(req)) return res.sendStatus(403);
    req.session.destroy(() => res.redirect('/login'));
  });

  get('/:page?', isaAuth, async (req, res) => {
    let page = 'home'
    let list = [];
    let roleList = [];
    const id = await this.idpam.getIdFromCredential({ _id: req.session.user.credentialId });
    if (!id) return res.redirect('/login');
    const getSchemas = () => Object.keys(mongoose.connection.collections);

    if (req.params.page) {
      page = req.params.page;
      if ((page === 'roles' || page === 'identities') && !isDemoAdmin(req, this.idpam)) {
        return res.sendStatus(403);
      }

      switch(req.params.page) {
        case "roles": list = await this.idpam.db.models.role.find().populate('permissions').lean(); break;
        case "identities":
          list = await this.idpam.db.models.identity.find()
            .populate('metadatas')
            .populate({ path: 'credentials.simplecredentials', select: '+userfacade', populate: 'roles' })
            .populate({ path: 'credentials.tokencredentials', populate: 'roles' })
            .populate({ path: 'credentials.sshkeycredentials', populate: 'roles' })
            .populate({ path: 'credentials.ldapcredentials', populate: 'roles' })
            .lean();
          roleList = await this.idpam.db.models.role.find().lean();
          break;
        default: page='home';
      }

    }

    if (!req.session.demoCsrf) req.session.demoCsrf = randomBytes(32).toString('hex');
    if (page === 'home' && isDemoAdmin(req, this.idpam)) {
      roleList = await this.idpam.db.models.role.find().lean();
    }
    res.render(page, {
      pageTitle: page,
      theme:"dark-theme",
      demoReadOnly: isDemoAdmin(req, this.idpam),
      user: req.session.user,
      list,
      roleList,
      currentCredentialId: req.session.user.credentialId,
      csrfToken: req.session.demoCsrf,
      id,
      getSchemas
    });

  });

  post('/lapi', isaAuth, async (req, res) => {
    return res.status(410).json({ success: false, code: 410, message: 'Legacy API retired' });
  });

  post('/demo/identities/:id/profile', isaAuth, async (req, res) => {
    if (!isDemoAdmin(req, this.idpam)) return res.sendStatus(403);
    if (!verifyDemoCsrf(req)) return res.sendStatus(403);
    if (!mongoose.isValidObjectId(req.params.id)) return res.sendStatus(400);

    let profile;
    try {
      const { csrfToken, ...input } = req.body;
      profile = normalizeDemoProfileInput(input);
    } catch {
      return res.status(400).send('Los datos del perfil no son válidos.');
    }

    const models = this.idpam.db.models;
    const identity = await models.identity.findOne({ _id: req.params.id, domain: 'demo' });
    if (!identity) return res.sendStatus(404);
    const metadata = await models.metadata.findById(identity.metadatas);
    if (!metadata) return res.sendStatus(404);
    metadata.nickName = profile.nickName;
    metadata.names = replaceFirstDemoNameItem(metadata.names, profile.names);
    metadata.lastNames = replaceFirstDemoNameItem(metadata.lastNames, profile.lastNames);
    metadata.email = profile.email;
    await metadata.save();
    return res.redirect(303, '/identities');
  });

  get('/lapi/:verb/:target/:oldVal/:newVal?', isaAuth, async (req, res) => {
    return res.status(410).json({ success: false, code: 410, message: 'Legacy API retired' });
  });

  registerManagementRoutes(this.router, this.idpam.db.models, isaAuth, this.idpam);

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
  const active = await this.idpam.getCredential(credential._id);
  if (!active || active.enabled === false ||
      (active.expiresAt && active.expiresAt <= new Date())) return false;
  const id = await this.idpam.getIdFromCredential(active);
  if (!id || !id.metadatas) return false;
  req.session.user = {
    nickName: id.metadatas.nickName,
    domain: id.domain,
    credentialName: active.name,
    credentialId: active._id,
    identityId: id._id
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

import mongoose from 'mongoose';
import { timingSafeEqual } from 'node:crypto';
import { normalizeDemoProfileInput, updateDemoNameItems } from '../demo/profilePolicy.js';
import { normalizePermissionInput, normalizeRoleName } from '../demo/rolePolicy.js';
import { roleAllows } from '../am/permissionMatch.js';
import { normalizeSimpleCredentialInput } from './credentialPolicy.js';
import { isDemoAdmin } from './adminAccess.js';
import { issueToken, normalizeTokenLifetime } from './tokenPolicy.js';
import { parseSshEd25519 } from './sshProof.js';

function validCsrf(req) {
  const expected = req.session.demoCsrf;
  const supplied = req.body?.csrfToken;
  return typeof expected === 'string' && typeof supplied === 'string' &&
    expected.length === supplied.length &&
    timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
}

function managed(idpam, handler) {
  return async (req, res, next) => {
    if (!isDemoAdmin(req) || !validCsrf(req)) {
      return res.sendStatus(403);
    }
    try { await handler(req, res); }
    catch (error) {
      if (error instanceof TypeError || error instanceof mongoose.Error.ValidationError) {
        return res.status(400).send(error.message);
      }
      next(error);
    }
  };
}

function assertId(value) {
  if (!mongoose.isValidObjectId(value)) throw new TypeError('Invalid identifier');
  return value;
}

function redirect(res, path) { return res.redirect(303, path); }

// Explicit operations replace the legacy arbitrary model/path mutation API.
export function registerManagementRoutes(router, models, sessionAuth, idpam, mutationLimiter=(req, res, next) => next()) {
  const protect = handler => managed(idpam, handler);
  const post = (path, ...handlers) => router.post(path, mutationLimiter, ...handlers);
  post('/identities', sessionAuth, protect(async (req, res) => {
    const profile = normalizeDemoProfileInput({
      nickName: req.body.nickName, names: req.body.names,
      lastNames: req.body.lastNames, email: req.body.email
    });
    const type = req.body.type;
    if (!['user', 'service'].includes(type)) throw new TypeError('Invalid identity type');
    const metadata = await models.metadata.create({
      nickName: profile.nickName, names: profile.names ? [profile.names] : [],
      lastNames: profile.lastNames ? [profile.lastNames] : [], email: profile.email
    });
    await models.identity.create({ domain: 'demo', type, credentials: {}, metadatas: metadata._id });
    redirect(res, '/identities');
  }));

  post('/identities/:id/metadata/:field/items', sessionAuth, protect(async (req, res) => {
    const { field } = req.params;
    if (!['names', 'lastNames'].includes(field)) throw new TypeError('Unsupported metadata field');
    const identity = await models.identity.findOne({ _id: assertId(req.params.id), domain: 'demo' });
    if (!identity) return res.sendStatus(404);
    const metadata = await models.metadata.findById(identity.metadatas);
    if (!metadata) return res.sendStatus(404);

    const operation = req.body.operation;
    const index = typeof req.body.index === 'string' && /^(0|[1-9]\d*)$/.test(req.body.index)
      ? Number(req.body.index) : NaN;
    metadata[field] = updateDemoNameItems(metadata[field], {
      operation, index, value: req.body.value
    });
    await metadata.save();
    redirect(res, '/');
  }));

  post('/identities/:id/delete', sessionAuth, protect(async (req, res) => {
    const identity = await models.identity.findOne({ _id: assertId(req.params.id), domain: 'demo' });
    if (!identity) return res.sendStatus(404);
    if (Object.values(identity.credentials.toObject()).some(values => values.length)) {
      return res.status(409).send('Remove credentials before deleting an identity');
    }
    await models.identity.deleteOne({ _id: identity._id });
    await models.metadata.deleteOne({ _id: identity.metadatas });
    redirect(res, '/identities');
  }));

  post('/identities/:id/credentials/simple', sessionAuth, protect(async (req, res) => {
    const identity = await models.identity.findOne({ _id: assertId(req.params.id), domain: 'demo' });
    if (!identity) return res.sendStatus(404);
    const input = normalizeSimpleCredentialInput(req.body, { creating: true });
    if (await models.simplecredential.exists({ userfacade: input.userfacade })) {
      return res.status(409).send('Username already exists');
    }
    const existingRoles = await models.role.countDocuments({ _id: { $in: input.roleIds } });
    if (existingRoles !== input.roleIds.length) return res.status(400).send('Unknown role');
    const credential = await models.simplecredential.create({
      name: input.name, userfacade: input.userfacade, password: input.password,
      enabled: input.enabled, roles: input.roleIds
    });
    try {
      identity.credentials.simplecredentials.push(credential._id);
      await identity.save();
    } catch (error) {
      await models.simplecredential.deleteOne({ _id: credential._id });
      throw error;
    }
    redirect(res, '/identities');
  }));

  post('/credentials/simple/:id', sessionAuth, protect(async (req, res) => {
    const id = assertId(req.params.id);
    if (String(req.session.user.credentialId) === id) return res.sendStatus(403);
    const credential = await models.simplecredential.findById(id);
    if (!credential) return res.sendStatus(404);
    const input = normalizeSimpleCredentialInput(req.body);
    const existingRoles = await models.role.countDocuments({ _id: { $in: input.roleIds } });
    if (existingRoles !== input.roleIds.length) return res.status(400).send('Unknown role');
    credential.name = input.name;
    credential.enabled = input.enabled;
    credential.roles = input.roleIds;
    if (input.password) credential.password = input.password;
    await credential.save();
    redirect(res, '/identities');
  }));

  post('/credentials/simple/:id/delete', sessionAuth, protect(async (req, res) => {
    const id = assertId(req.params.id);
    if (String(req.session.user.credentialId) === id) return res.sendStatus(403);
    const identity = await models.identity.findOne({ 'credentials.simplecredentials': id, domain: 'demo' });
    if (!identity) return res.sendStatus(404);
    identity.credentials.simplecredentials = identity.credentials.simplecredentials.filter(value => String(value) !== id);
    await identity.save();
    await models.simplecredential.deleteOne({ _id: id });
    redirect(res, '/identities');
  }));

  post('/identities/:id/credentials/token', sessionAuth, protect(async (req, res) => {
    const identity = await models.identity.findOne({ _id: assertId(req.params.id), domain: 'demo' });
    if (!identity) return res.sendStatus(404);
    const name = String(req.body.name || '').trim();
    if (!/^[\p{L}\p{N} ._-]{2,60}$/u.test(name)) throw new TypeError('Invalid token name');
    const expiresAt = normalizeTokenLifetime(req.body.hours);
    const roleIds = [...new Set([].concat(req.body.roleIds || []))].map(assertId);
    if (await models.role.countDocuments({ _id: { $in: roleIds } }) !== roleIds.length) {
      return res.status(400).send('Unknown role');
    }
    const { token, tokenHash } = issueToken();
    const credential = await models.tokencredential.create({
      name, tokenHash, expiresAt, enabled: true, roles: roleIds
    });
    try {
      identity.credentials.tokencredentials.push(credential._id);
      await identity.save();
    } catch (error) {
      await models.tokencredential.deleteOne({ _id: credential._id });
      throw error;
    }
    res.set('Cache-Control', 'no-store');
    if (req.get('Accept') === 'application/json') {
      return res.status(201).json({ token, expiresAt: expiresAt.toISOString() });
    }
    return res.render('token-issued', {
      pageTitle: 'Token emitido', theme: 'dark-theme', token, expiresAt,
      user: req.session.user, demoReadOnly: true, csrfToken: req.session.demoCsrf
    });
  }));

  post('/credentials/token/:id/delete', sessionAuth, protect(async (req, res) => {
    const id = assertId(req.params.id);
    const identity = await models.identity.findOne({ 'credentials.tokencredentials': id, domain: 'demo' });
    if (!identity) return res.sendStatus(404);
    identity.credentials.tokencredentials = identity.credentials.tokencredentials.filter(value => String(value) !== id);
    await identity.save();
    await models.tokencredential.deleteOne({ _id: id });
    redirect(res, '/identities');
  }));

  post('/identities/:id/credentials/ssh', sessionAuth, protect(async (req, res) => {
    const identity = await models.identity.findOne({ _id: assertId(req.params.id), domain: 'demo' });
    if (!identity) return res.sendStatus(404);
    const name = String(req.body.name || '').trim();
    if (!/^[\p{L}\p{N} ._-]{2,60}$/u.test(name)) throw new TypeError('Invalid key name');
    const { normalized: publicKey } = parseSshEd25519(req.body.publicKey);
    const roleIds = [...new Set([].concat(req.body.roleIds || []))].map(assertId);
    if (await models.role.countDocuments({ _id: { $in: roleIds } }) !== roleIds.length) {
      return res.status(400).send('Unknown role');
    }
    const credential = await models.sshkeycredential.create({ name, publicKey, enabled: true, roles: roleIds });
    try {
      identity.credentials.sshkeycredentials.push(credential._id);
      await identity.save();
    } catch (error) {
      await models.sshkeycredential.deleteOne({ _id: credential._id });
      throw error;
    }
    redirect(res, '/identities');
  }));

  post('/credentials/ssh/:id/delete', sessionAuth, protect(async (req, res) => {
    const id = assertId(req.params.id);
    const identity = await models.identity.findOne({ 'credentials.sshkeycredentials': id, domain: 'demo' });
    if (!identity) return res.sendStatus(404);
    identity.credentials.sshkeycredentials = identity.credentials.sshkeycredentials.filter(value => String(value) !== id);
    await identity.save();
    await models.sshkeycredential.deleteOne({ _id: id });
    redirect(res, '/identities');
  }));

  post('/roles', sessionAuth, protect(async (req, res) => {
    await models.role.create({ name: normalizeRoleName(req.body.name), permissions: [] });
    redirect(res, '/roles');
  }));

  post('/roles/:id', sessionAuth, protect(async (req, res) => {
    const role = await models.role.findById(assertId(req.params.id));
    if (!role) return res.sendStatus(404);
    role.name = normalizeRoleName(req.body.name);
    await role.save();
    redirect(res, '/roles');
  }));

  post('/roles/:id/delete', sessionAuth, protect(async (req, res) => {
    const id = assertId(req.params.id);
    const role = await models.role.findById(id);
    if (!role) return res.sendStatus(404);
    const assigned = await Promise.all([
      models.simplecredential.exists({ roles: id }),
      models.tokencredential.exists({ roles: id }),
      models.sshkeycredential.exists({ roles: id }),
      models.ldapcredential.exists({ roles: id })
    ]);
    if (assigned.some(Boolean)) return res.status(409).send('Role is assigned to a credential');
    await models.role.deleteOne({ _id: id });
    redirect(res, '/roles');
  }));

  post('/roles/:id/permissions', sessionAuth, protect(async (req, res) => {
    const role = await models.role.findById(assertId(req.params.id));
    if (!role) return res.sendStatus(404);
    const permission = await models.permission.create(normalizePermissionInput(req.body));
    role.permissions.push(permission._id);
    await role.save();
    redirect(res, '/roles');
  }));

  post('/permissions/:id', sessionAuth, protect(async (req, res) => {
    const permission = await models.permission.findById(assertId(req.params.id));
    if (!permission) return res.sendStatus(404);
    const input = normalizePermissionInput(req.body);
    permission.targetObjects = input.targetObjects;
    permission.verbs = input.verbs;
    await permission.save();
    redirect(res, '/roles');
  }));

  post('/roles/:roleId/permissions/:permissionId/delete', sessionAuth, protect(async (req, res) => {
    const role = await models.role.findById(assertId(req.params.roleId));
    const permissionId = assertId(req.params.permissionId);
    if (!role || !role.permissions.some(id => String(id) === permissionId)) return res.sendStatus(404);
    role.permissions = role.permissions.filter(id => String(id) !== permissionId);
    await role.save();
    if (!await models.role.exists({ permissions: permissionId })) {
      await models.permission.deleteOne({ _id: permissionId });
    }
    redirect(res, '/roles');
  }));

  post('/access/check', sessionAuth, protect(async (req, res) => {
    const role = await models.role.findById(assertId(req.body.roleId)).populate('permissions');
    if (!role) return res.sendStatus(404);
    const { target, verb } = req.body;
    if (typeof target !== 'string' || target.length > 120 || typeof verb !== 'string') {
      throw new TypeError('Invalid access query');
    }
    const allowed = roleAllows(role, verb, target);
    res.json({ role: role.name, target, verb, allowed });
  }));
}

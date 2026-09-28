// The disposable seed account is identified by its database ID, never by an
// editable credential label or username supplied by a visitor.
export function isDemoAdmin(req, idpam) {
  const current = req.session?.user?.credentialId;
  const seeded = idpam.demoAdminCredentialId;
  return Boolean(current && seeded && String(current) === String(seeded));
}

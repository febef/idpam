function exactHttpsUrl(value, label) {
  let url;
  try { url = new URL(value); }
  catch { throw new Error(`${label} must be an absolute URL`); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error(`${label} must be a clean HTTPS URL`);
  }
  return url;
}

export function publicRuntimePolicy({ publicOrigin, issuer, redirectUri }) {
  const origin = exactHttpsUrl(publicOrigin, 'PUBLIC_ORIGIN');
  const issuerUrl = exactHttpsUrl(issuer, 'OIDC_ISSUER');
  const callback = exactHttpsUrl(redirectUri, 'OIDC_REDIRECT_URI');

  if (origin.pathname !== '/' || callback.origin !== origin.origin ||
      callback.pathname !== '/oidc/callback') {
    throw new Error('OIDC_REDIRECT_URI must be the public origin /oidc/callback');
  }
  if (issuerUrl.origin !== origin.origin || issuerUrl.pathname !== '/dex') {
    throw new Error('OIDC_ISSUER must be the public origin /dex');
  }

  return {
    publicOrigin: origin.origin,
    issuer: issuerUrl.href.replace(/\/$/, ''),
    redirectUri: callback.href
  };
}

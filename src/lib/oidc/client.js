import * as oidc from 'openid-client';

let configPromise;
let activeKey;

// Dex publishes a browser-reachable loopback issuer. Inside Compose the app
// reaches the same instance by its private service name; response metadata and
// ID-token issuer remain the public loopback URL and are validated normally.
function internalDexFetchFor(issuer, internalOrigin) {
  return async (input, init) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    if (url.origin !== issuer.origin || !url.pathname.startsWith(`${issuer.pathname}/`)) {
      throw new TypeError('OIDC request escaped the configured Dex boundary');
    }
    if (!internalOrigin) {
      url.hostname = 'dex';
      return fetch(new Request(url, request));
    }
    const target = new URL(url.pathname + url.search, internalOrigin);
    return fetch(new Request(target, request));
  };
}

export function getOidcConfig({ issuer: issuerValue, internalOrigin=process.env.OIDC_INTERNAL_ORIGIN } = {}) {
  if (process.env.IDPAM_DEMO_MODE !== '1') throw new Error('Local OIDC requires disposable demo mode');
  const issuer = new URL(issuerValue);
  const key = `${issuer.href}|${internalOrigin || ''}`;
  if (!configPromise || activeKey !== key) {
    activeKey = key;
    const options = {
      [oidc.customFetch]: internalDexFetchFor(issuer, internalOrigin),
      timeout: 5
    };
    if (issuer.protocol === 'http:') options.execute = [oidc.allowInsecureRequests];
    configPromise = oidc.discovery(issuer, 'idpam-demo', { token_endpoint_auth_method: 'none' }, oidc.None(), {
      ...options
    }).catch(error => { configPromise = undefined; activeKey = undefined; throw error; });
  }
  return configPromise;
}

export { oidc };

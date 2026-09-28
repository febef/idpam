import * as oidc from 'openid-client';

const issuer = new URL('http://127.0.0.1:5556/dex');
export const redirectUri = 'http://127.0.0.1:3000/oidc/callback';
let configPromise;

// Dex publishes a browser-reachable loopback issuer. Inside Compose the app
// reaches the same instance by its private service name; response metadata and
// ID-token issuer remain the public loopback URL and are validated normally.
async function internalDexFetch(input, init) {
  const request = new Request(input, init);
  const url = new URL(request.url);
  if (url.hostname !== '127.0.0.1' || url.port !== '5556' || !url.pathname.startsWith('/dex/')) {
    throw new TypeError('OIDC request escaped the local Dex boundary');
  }
  url.hostname = 'dex';
  return fetch(new Request(url, request));
}

export function getOidcConfig() {
  if (process.env.IDPAM_DEMO_MODE !== '1') throw new Error('Local OIDC requires disposable demo mode');
  if (!configPromise) {
    configPromise = oidc.discovery(issuer, 'idpam-demo', { token_endpoint_auth_method: 'none' }, oidc.None(), {
      [oidc.customFetch]: internalDexFetch,
      execute: [oidc.allowInsecureRequests], // loopback-only Compose lab; public release requires HTTPS
      timeout: 5
    }).catch(error => { configPromise = undefined; throw error; });
  }
  return configPromise;
}

export { oidc };

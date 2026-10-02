import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('the public overlay exposes only IdPAM and Dex on the exact demo host', async () => {
  const [route, service, workload] = await Promise.all([
    read('deploy/production/httproute.yaml'),
    read('deploy/production/service.yaml'),
    read('deploy/production/workload.yaml')
  ]);

  assert.match(route, /sectionName: demos-apx-wildcard/);
  assert.match(route, /- idpam\.demos\.apx\.domus\.land/);
  assert.match(route, /value: \/dex[\s\S]*?port: 5556/);
  assert.match(route, /value: \/[\s\S]*?port: 3000/);
  assert.doesNotMatch(service, /27017|6360/);
  assert.match(workload, /PUBLIC_ORIGIN[\s\S]*?https:\/\/idpam\.demos\.apx\.domus\.land/);
  assert.match(workload, /OIDC_REDIRECT_URI[\s\S]*?https:\/\/idpam\.demos\.apx\.domus\.land\/oidc\/callback/);
});

test('the public overlay remains disposable, single-replica and release gated', async () => {
  const [kustomization, workload, networkPolicy] = await Promise.all([
    read('deploy/production/kustomization.yaml'),
    read('deploy/production/workload.yaml'),
    read('deploy/production/network-policy.yaml')
  ]);

  const releaseTags = [...kustomization.matchAll(/newTag: (v\d+\.\d+\.\d+)/g)].map((match) => match[1]);
  assert.equal(releaseTags.length, 3);
  assert.equal(new Set(releaseTags).size, 1);
  assert.match(workload, /replicas: 1/);
  assert.match(workload, /type: Recreate/);
  assert.equal((workload.match(/medium: Memory/g) || []).length, 9);
  assert.match(networkPolicy, /- ingress/);
  assert.match(networkPolicy, /- host/);
  assert.match(networkPolicy, /egress: \[\]/);
});

test('the project-owned runtime images and their bases are pinned', async () => {
  const [app, ldap, ca, compose] = await Promise.all([
    read('Dockerfile.demo'),
    read('Dockerfile.demo-ldap'),
    read('Dockerfile.demo-ca'),
    read('compose.demo.yaml')
  ]);

  assert.match(app, /^FROM node:22-bookworm-slim@sha256:[a-f0-9]{64}/m);
  assert.match(ldap, /^FROM alpine:3\.23@sha256:[a-f0-9]{64}/m);
  assert.match(ldap, /openldap=2\.6\.13-r0/);
  assert.match(ca, /^FROM alpine:3\.22@sha256:[a-f0-9]{64}/m);
  assert.match(compose, /dex:v2\.45\.1@sha256:[a-f0-9]{64}/);
  assert.match(compose, /mongo:7\.0@sha256:[a-f0-9]{64}/);
});

test('the disposable CA locks down the key before transferring ownership', async () => {
  const script = await read('scripts/create-demo-ca.sh');
  const chmodIndex = script.indexOf('chmod 0600 /certs/tls.key');
  const chownIndex = script.indexOf('chown 100:101 /certs/tls.key');

  assert.notEqual(chmodIndex, -1);
  assert.notEqual(chownIndex, -1);
  assert.ok(
    chmodIndex < chownIndex,
    'chmod must happen before chown when the init container drops CAP_FOWNER'
  );
});

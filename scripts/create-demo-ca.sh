#!/bin/sh
set -eu

# Disposable certificate for the private Compose network. Never use it as a
# public trust anchor; Kubernetes will use managed TLS and Secrets separately.
openssl req -x509 -nodes -newkey rsa:3072 -days 2 -sha256 \
  -keyout /certs/tls.key -out /certs/tls.crt \
  -subj /CN=ldap -addext 'subjectAltName=DNS:ldap,DNS:idpam-demo,IP:127.0.0.1' >/dev/null 2>&1
cp /certs/tls.crt /certs/ca.crt
cp /certs/ca.crt /ca/ca.crt
chmod 0644 /certs/tls.crt /certs/ca.crt /ca/ca.crt
chmod 0600 /certs/tls.key
chown 100:101 /certs/tls.key

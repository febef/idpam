#!/bin/sh
set -eu

# Disposable certificate for the private Compose network. Never use it as a
# public trust anchor; Kubernetes will use managed TLS and Secrets separately.
if [ ! -s /certs/tls.crt ] || [ ! -s /certs/tls.key ]; then
  openssl req -x509 -nodes -newkey rsa:3072 -days 2 -sha256 \
    -keyout /certs/tls.key -out /certs/tls.crt \
    -subj /CN=ldap -addext 'subjectAltName=DNS:ldap' >/dev/null 2>&1
fi
cp /certs/tls.crt /certs/ca.crt
cp /certs/ca.crt /ca/ca.crt
chmod 0644 /certs/tls.crt /certs/ca.crt /ca/ca.crt
chown 911:911 /certs/tls.key
chmod 0600 /certs/tls.key

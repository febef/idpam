#!/usr/bin/env bash
# Build from a clean temporary context because the NAS backup contains
# AppleDouble metadata that Docker Desktop cannot read from this mount.
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
demo_context=$(mktemp -d /private/tmp/idpam-demo-build.XXXXXX)
trap 'rm -r -- "$demo_context"' EXIT

rsync -a \
  --exclude='.git' \
  --exclude='._*' \
  --exclude='node_modules*' \
  --exclude='docs' \
  --exclude='test' \
  "$repo_root/" "$demo_context/"

docker build -t idpam-demo:local \
  -f "$demo_context/Dockerfile.demo" "$demo_context"
docker build -t idpam-demo-ca:local \
  -f "$demo_context/Dockerfile.demo-ca" "$demo_context"
docker build -t idpam-demo-ldap:local \
  -f "$demo_context/Dockerfile.demo-ldap" "$demo_context"

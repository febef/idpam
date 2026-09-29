# IdPAM contributor and agent guide

This file defines the working contract for humans and automated coding agents
contributing to the public IdPAM repository.

## Product scope

IdPAM is a recovered proof of concept for identity, credentials and granular
authorization. Treat it as learning material and an experimental system, not as
a production-ready identity provider or a replacement for established IAM
products.

The current, verifiable behavior is documented in:

- `README.md` for project setup and publication status;
- `docs/demo-contract.md` for the local demo contract and its boundaries;
- `docs/functionality-audit.md` for implemented flows and known limitations;
- `docs/local-demo-guide.md` for the reproducible walkthrough.

When documentation, tests and implementation disagree, do not silently choose
one. Verify the behavior, correct the mismatch and keep claims limited to the
available evidence.

## Preserve these decisions

- Keep the original Jade/Pug visual language and inline-editing interaction
  unless a task explicitly requests a redesign.
- Use only synthetic identities, credentials and directory data.
- Keep MongoDB and LDAP private to the Compose network. The local application
  and Dex endpoints must remain bound to loopback.
- Keep the historical generic `/lapi` HTTP interface disabled. New behavior
  must use explicit, validated use cases and routes.
- Authentication establishes an identity and credential context;
  authorization remains a separate policy decision.
- Authorization fails closed. Do not describe explicit deny rules, regular
  expressions, direct Bearer authorization or production integrations as
  implemented until code and tests prove them.
- The public demo profile must remain disposable. A periodic reset is not a
  substitute for visitor isolation.

## Engineering workflow

1. Work from `develop` and use Conventional Commits.
2. Add or update tests before changing a material behavior.
3. Run the local checks:

   ```bash
   npm ci --prefix src --no-audit --no-fund
   npm test --prefix src
   npm audit --prefix src --audit-level=high
   docker build --file Dockerfile.demo --tag idpam:verify .
   ```

4. For the end-to-end local flow, start the disposable stack and run:

   ```bash
   RUN_HTTP_TEST=1 node --test test/demo-http.test.mjs
   ```

5. Promote `develop` to `main` only by fast-forward after required CI passes.
   Do not synthesize a merge commit.
6. Keep the GitHub and GitLab mirrors on the same verified commit.

CI runs tests, dependency auditing, SAST, image vulnerability and secret
scanning, and emits an SBOM. A `main` pipeline reuses the already scanned image
from the same commit when available, then applies the semantic release tag.

## Security and publication boundaries

- Never commit secrets, tokens, private keys, real personal data, internal host
  names, private infrastructure details or operational notebooks.
- Do not expose the local Compose profile to the Internet.
- A public deployment requires the unresolved gates in
  `docs/functionality-audit.md`, including stable LDAP, HTTPS OIDC, rate
  limiting, shared-session design, visitor isolation and accessibility review.
- Do not weaken CSRF, session, credential-revocation or permission checks to
  simplify a demo.
- Do not claim production adoption, completed release maturity or security
  certification. Use precise terms such as “PoC”, “local demo” and “verified by
  the listed tests”.

## Change quality

Keep changes small, readable and traceable. Explain non-obvious security
decisions in the closest relevant document or test. Avoid generated noise,
vendored dependencies and host-specific files. Before committing, inspect the
diff, validate author and committer identity, and confirm that the change does
not broaden the documented trust boundary.

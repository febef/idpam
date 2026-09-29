# IdPAM public demo overlay

This overlay publishes one disposable PoC at
`https://idpam.demos.apx.domus.land`. IdPAM, MongoDB, the synthetic LDAP
directory and Dex share one Pod so internal dependencies remain on loopback.
Only IdPAM and Dex are selected by the Service; the HTTPRoute sends `/dex` to
Dex and every other path to IdPAM. MongoDB and LDAP have no edge route.

All state uses memory-backed `emptyDir` volumes. `Recreate` plus one replica
keeps session rate limits and the disposable tenant lifecycle coherent. The
three project-owned images are release-gated with the
`v0.0.0-unreleased` placeholder until CI publishes a scanned semantic tag.
Third-party runtime images and base images are pinned by digest.

The namespace denies all Pod egress and permits Cilium's ingress and host
identities only on the two HTTP ports. LDAP credentials and identities are synthetic
and documented public fixtures; this overlay must never receive real identity
data.

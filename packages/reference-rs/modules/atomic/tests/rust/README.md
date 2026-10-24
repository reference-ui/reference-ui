# Atomic native tests

Rust integration tests for scan, harvest, and serialization. Covers scan retention (needle-gate, short reads, lossy UTF-8, token lifecycle), the harvest pool census, sinks, and sources, serializer parity fuzzing against the diet oracle, skip backfill, the nesting gate's one run per source per compile (`screen_once` on rootless compiles, `screen_once_rooted` on a rooted one where the host trace reads staged text), and linear compile time over a 1,000 and a 2,000 file chain of same-name re-exports (`reexport_chain`).

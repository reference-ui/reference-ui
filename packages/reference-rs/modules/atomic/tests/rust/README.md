# Atomic native tests

Rust integration tests for scan, harvest, and serialization. Covers scan retention (needle-gate, short reads, lossy UTF-8, token lifecycle), the harvest pool census, sinks, and sources, serializer parity fuzzing against the diet oracle, skip backfill, and the nesting gate's one run per source per compile.

# ATM-SEAM-08 — Namer-golden

The runtime namer reproduces every namer golden: one block per `tests/goldens/namer/*.json`, lexical functions first, then each procedure, then the composed `name()` cases. A drift names the exact function. The Rust freshness guard behind the goldens is Slice 1 work, not this case.
Contract: [SPEC.md](../../../SPEC.md).

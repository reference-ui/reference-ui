# NEO-DIAG-05 — ATM-E-UNKNOWN-TOKEN reproduces through the whole compiler as error

Explicit `{path}` reference that names no token. The world carries the minimal fixture (theme/bad.ts) on the diagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with error severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/resolve/tokens/mod.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-E-UNKNOWN-TOKEN (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-E-UNKNOWN-TOKEN, atm-e-unknown-token, diagnostics case index, NEO-DIAG-05

# NEO-DIAG-09 — ATM-W-MALFORMED-OPACITY reproduces through the whole compiler as warning

Malformed `/opacity` modifier on a token path. The world carries the minimal fixture (theme/opacity.ts) on the diagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/resolve/tokens/mod.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-W-MALFORMED-OPACITY (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-W-MALFORMED-OPACITY, atm-w-malformed-opacity, diagnostics case index, NEO-DIAG-09

# NEO-DIAG-03 — ATM-W-UNKNOWN-COLOR reproduces through the whole compiler as warning

Bare value on a color prop that is neither a color token nor a CSS color. The world carries the minimal fixture (theme/color.ts) on the diagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/resolve/tokens/mod.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-W-UNKNOWN-COLOR (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-W-UNKNOWN-COLOR, atm-w-unknown-color, diagnostics case index, NEO-DIAG-03

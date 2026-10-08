# NEO-DIAG-31 — ATM-W-UNFOLDABLE-KEY reproduces through the whole compiler as warning

Computed key that does not fold. The world carries the minimal fixture (theme/key.ts) on the compilerDiagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/extract/expressions/object/mod.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-W-UNFOLDABLE-KEY (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-W-UNFOLDABLE-KEY, atm-w-unfoldable-key, diagnostics case index, NEO-DIAG-31

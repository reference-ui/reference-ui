# NEO-DIAG-24 — ATM-W-UNFOLDABLE-SPREAD reproduces through the whole compiler as warning

Unresolvable object spread; siblings kept. The world carries the minimal fixture (theme/dynamic-spread.ts) on the compilerDiagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/extract/expressions/object/spread.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-W-UNFOLDABLE-SPREAD (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-W-UNFOLDABLE-SPREAD, atm-w-unfoldable-spread, diagnostics case index, NEO-DIAG-24

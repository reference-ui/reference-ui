# NEO-DIAG-36 — ATM-W-RESPONSIVE-ARRAY-SPREAD reproduces through the whole compiler as warning

A spread inside a value array refuses the whole array. The world carries the minimal fixture (theme/arr-spread.ts) on the compilerDiagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/extract/expressions/responsive.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-W-RESPONSIVE-ARRAY-SPREAD (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-W-RESPONSIVE-ARRAY-SPREAD, atm-w-responsive-array-spread, diagnostics case index, NEO-DIAG-36

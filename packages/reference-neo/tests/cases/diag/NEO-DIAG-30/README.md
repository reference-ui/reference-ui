# NEO-DIAG-30 — ATM-W-MUTATED-BINDING reproduces through the whole compiler as warning

Binding used after a tracked write. The world carries the minimal fixture (theme/mutated.ts) on the compilerDiagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/extract/expressions/walk/leaf.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-W-MUTATED-BINDING (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-W-MUTATED-BINDING, atm-w-mutated-binding, diagnostics case index, NEO-DIAG-30

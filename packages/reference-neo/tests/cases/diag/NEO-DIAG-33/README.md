# NEO-DIAG-33 — ATM-W-NON-OBJECT-CONDITION reproduces through the whole compiler as warning

Condition key whose value is not an object. The world carries the minimal fixture (theme/cond-shape.ts) on the compilerDiagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/extract/expressions/object/condition.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-W-NON-OBJECT-CONDITION (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-W-NON-OBJECT-CONDITION, atm-w-non-object-condition, diagnostics case index, NEO-DIAG-33

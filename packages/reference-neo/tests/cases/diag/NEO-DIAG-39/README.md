# NEO-DIAG-39 — ATM-W-PARTIAL-OBJECT-PROP reproduces through the whole compiler as warning

A const-object prop that kept static leaves while dropping a dynamic arm. The world carries the minimal fixture (theme/partial-prop.ts) on the compilerDiagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/extract/expressions/object/entries.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-W-PARTIAL-OBJECT-PROP (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-W-PARTIAL-OBJECT-PROP, atm-w-partial-object-prop, diagnostics case index, NEO-DIAG-39

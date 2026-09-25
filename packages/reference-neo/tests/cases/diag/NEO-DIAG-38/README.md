# NEO-DIAG-38 — ATM-W-UNFOLDABLE-OBJECT-PROP reproduces through the whole compiler as warning

A recorded const-object prop with no static style value. The world carries the minimal fixture (theme/obj-prop.ts) on the compilerDiagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/extract/expressions/object/entries.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-W-UNFOLDABLE-OBJECT-PROP (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-W-UNFOLDABLE-OBJECT-PROP, atm-w-unfoldable-object-prop, diagnostics case index, NEO-DIAG-38

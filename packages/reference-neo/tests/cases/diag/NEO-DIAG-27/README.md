# NEO-DIAG-27 — ATM-W-DYNAMIC-TEMPLATE reproduces through the whole compiler as warning

Interpolated template over unfoldable parts. The world carries the minimal fixture (theme/dynamic-tpl.ts) on the compilerDiagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/extract/expressions/literal.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-W-DYNAMIC-TEMPLATE (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-W-DYNAMIC-TEMPLATE, atm-w-dynamic-template, diagnostics case index, NEO-DIAG-27

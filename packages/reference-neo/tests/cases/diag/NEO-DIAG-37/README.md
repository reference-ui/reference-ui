# NEO-DIAG-37 — ATM-W-TAGGED-TEMPLATE-SITE reproduces through the whole compiler as warning

A tagged template on a live `css` binding. The world carries the minimal fixture (theme/tagged.ts) on the compilerDiagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/extract/mod.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-W-TAGGED-TEMPLATE-SITE (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-W-TAGGED-TEMPLATE-SITE, atm-w-tagged-template-site, diagnostics case index, NEO-DIAG-37

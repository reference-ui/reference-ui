# NEO-DIAG-34 — ATM-W-NON-OBJECT-CSS-ARG reproduces through the whole compiler as warning

A `css()` argument, merge-list element, or conditional arm is not a static style object. The world carries the minimal fixture (theme/css-arg.ts) on the compilerDiagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/extract/css/mod.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-W-NON-OBJECT-CSS-ARG (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-W-NON-OBJECT-CSS-ARG, atm-w-non-object-css-arg, diagnostics case index, NEO-DIAG-34

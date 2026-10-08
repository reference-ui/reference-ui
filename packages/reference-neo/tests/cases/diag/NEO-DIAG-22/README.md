# NEO-DIAG-22 — ATM-W-UNREALIZABLE-EXTENSION reproduces through the whole compiler as warning

A dialect extension whose served `css` form is fictional per live webref. The world carries the minimal fixture (theme/ext.ts) on the diagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/resolve/mod.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-W-UNREALIZABLE-EXTENSION (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-W-UNREALIZABLE-EXTENSION, atm-w-unrealizable-extension, diagnostics case index, NEO-DIAG-22

# NEO-DIAG-35 — ATM-W-NON-OBJECT-JSX-STYLE reproduces through the whole compiler as warning

A `css` / `r` / condition prop value is not a static style object. The world carries the minimal fixture (theme/jsx-style.tsx) on the compilerDiagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/extract/jsx/mod.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-W-NON-OBJECT-JSX-STYLE (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-W-NON-OBJECT-JSX-STYLE, atm-w-non-object-jsx-style, diagnostics case index, NEO-DIAG-35

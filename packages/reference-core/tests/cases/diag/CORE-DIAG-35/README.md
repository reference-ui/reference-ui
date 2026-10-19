# CORE-DIAG-35 — ATM-W-NON-OBJECT-JSX-STYLE reproduces through the whole compiler as warning

A `css` / `r` / condition prop value is not a static style object. The world carries a minimal theme fixture on the compilerDiagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: the atomic JSX extractor. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: ATM-W-NON-OBJECT-JSX-STYLE (the diagnostic registry inventory + the shared repro suite row).

> Search terms: ATM-W-NON-OBJECT-JSX-STYLE, atm-w-non-object-jsx-style, diagnostics case index, CORE-DIAG-35

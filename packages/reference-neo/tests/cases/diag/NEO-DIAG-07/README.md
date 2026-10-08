# NEO-DIAG-07 — ATM-W-MISSING-CONTAINER-ROOT reproduces through the whole compiler as warning

`@container` atoms without a container root. The world carries the minimal fixture (theme/cq.ts, theme/cq-globals.ts) on the diagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/resolve/conditions/mod.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-W-MISSING-CONTAINER-ROOT (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-W-MISSING-CONTAINER-ROOT, atm-w-missing-container-root, diagnostics case index, NEO-DIAG-07

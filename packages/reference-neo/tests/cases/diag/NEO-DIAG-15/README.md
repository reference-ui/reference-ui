# NEO-DIAG-15 — ATM-E-PARSE reproduces through the whole compiler as error

The source failed to parse; compile continues. The world carries the minimal fixture (theme/broken.tsx) on the diagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with error severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/stream.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-E-PARSE (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-E-PARSE, atm-e-parse, diagnostics case index, NEO-DIAG-15

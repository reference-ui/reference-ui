# NEO-DIAG-14 — ATM-W-TRACE-SKIPPED reproduces through the whole compiler as warning

A StyleTrace file skipped with its siblings kept. The world carries the minimal fixture (theme/broken.tsx) on the diagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/hosts/diagnostics.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-W-TRACE-SKIPPED (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-W-TRACE-SKIPPED, atm-w-trace-skipped, diagnostics case index, NEO-DIAG-14

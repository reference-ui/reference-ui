# NEO-DIAG-40 — ATM-W-TOKEN-CALL-REFUSED reproduces through the whole compiler as warning

A `token()` shape the call surface refused. The world carries the minimal fixture (theme/token-call.ts) on the compilerDiagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/extract/fold/token.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-W-TOKEN-CALL-REFUSED (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-W-TOKEN-CALL-REFUSED, atm-w-token-call-refused, diagnostics case index, NEO-DIAG-40

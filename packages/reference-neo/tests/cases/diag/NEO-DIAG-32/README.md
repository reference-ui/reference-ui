# NEO-DIAG-32 — ATM-W-UNKNOWN-BREAKPOINT reproduces through the whole compiler as warning

Unknown breakpoint name in an `r` prop object. The world carries the minimal fixture (theme/bp.ts) on the compilerDiagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/extract/expressions/object/keys.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-W-UNKNOWN-BREAKPOINT (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-W-UNKNOWN-BREAKPOINT, atm-w-unknown-breakpoint, diagnostics case index, NEO-DIAG-32

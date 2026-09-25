# NEO-DIAG-25 — ATM-W-DYNAMIC-EXPRESSION reproduces through the whole compiler as warning

Dynamic expression in value position; the position is skipped, siblings kept. The world carries the minimal fixture (theme/dynamic-expr.ts) on the compilerDiagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/extract/expressions/walk/call.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-W-DYNAMIC-EXPRESSION (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-W-DYNAMIC-EXPRESSION, atm-w-dynamic-expression, diagnostics case index, NEO-DIAG-25

# NEO-DIAG-23 — ATM-W-DYNAMIC-IDENTIFIER reproduces through the whole compiler as warning

Unresolvable free identifier in value position. The world carries the minimal fixture (theme/dynamic-ident.ts) on the compilerDiagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/extract/expressions/walk/leaf.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-W-DYNAMIC-IDENTIFIER (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-W-DYNAMIC-IDENTIFIER, atm-w-dynamic-identifier, diagnostics case index, NEO-DIAG-23

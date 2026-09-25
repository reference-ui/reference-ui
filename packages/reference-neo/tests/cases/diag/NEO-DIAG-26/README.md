# NEO-DIAG-26 — ATM-W-DYNAMIC-MEMBER reproduces through the whole compiler as warning

Unresolvable member expression in value position. The world carries the minimal fixture (theme/dynamic-member.ts) on the compilerDiagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/extract/expressions/walk/member.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-W-DYNAMIC-MEMBER (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-W-DYNAMIC-MEMBER, atm-w-dynamic-member, diagnostics case index, NEO-DIAG-26

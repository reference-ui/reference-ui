# CORE-DIAG-30 — ATM-W-MUTATED-BINDING reproduces through the whole compiler as warning

Binding used after a tracked write. The world carries a minimal theme fixture on the compilerDiagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: the atomic binding walker. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: ATM-W-MUTATED-BINDING (the diagnostic registry inventory + the shared repro suite row).

> Search terms: ATM-W-MUTATED-BINDING, atm-w-mutated-binding, diagnostics case index, CORE-DIAG-30

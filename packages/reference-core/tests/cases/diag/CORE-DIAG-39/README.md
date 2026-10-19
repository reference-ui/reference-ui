# CORE-DIAG-39 — ATM-W-PARTIAL-OBJECT-PROP reproduces through the whole compiler as warning

A const-object prop that kept static leaves while dropping a dynamic arm. The world carries a minimal theme fixture on the compilerDiagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: atomic object entries. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: ATM-W-PARTIAL-OBJECT-PROP (the diagnostic registry inventory + the shared repro suite row).

> Search terms: ATM-W-PARTIAL-OBJECT-PROP, atm-w-partial-object-prop, diagnostics case index, CORE-DIAG-39

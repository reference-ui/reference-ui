# CORE-DIAG-15 — ATM-E-PARSE reproduces through the whole compiler as error

The source failed to parse; compile continues. The world carries a minimal theme fixture on the diagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with error severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: the atomic stream writer. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: ATM-E-PARSE (the diagnostic registry inventory + the shared repro suite row).

> Search terms: ATM-E-PARSE, atm-e-parse, diagnostics case index, CORE-DIAG-15

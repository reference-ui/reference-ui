# CORE-DIAG-03 — ATM-W-UNKNOWN-COLOR reproduces through the whole compiler as warning

Bare value on a color prop that is neither a color token nor a CSS color. The world carries a minimal theme fixture on the diagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: the atomic token resolver. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: ATM-W-UNKNOWN-COLOR (the diagnostic registry inventory + the shared repro suite row).

> Search terms: ATM-W-UNKNOWN-COLOR, atm-w-unknown-color, diagnostics case index, CORE-DIAG-03

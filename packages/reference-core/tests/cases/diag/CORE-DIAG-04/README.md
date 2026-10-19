# CORE-DIAG-04 — ATM-W-UNKNOWN-TOKEN-PATH reproduces through the whole compiler as warning

Dotted path that names no token. The world carries a minimal theme fixture on the diagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: the atomic token resolver. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: ATM-W-UNKNOWN-TOKEN-PATH (the diagnostic registry inventory + the shared repro suite row).

> Search terms: ATM-W-UNKNOWN-TOKEN-PATH, atm-w-unknown-token-path, diagnostics case index, CORE-DIAG-04

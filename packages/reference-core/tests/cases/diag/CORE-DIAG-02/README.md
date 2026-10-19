# CORE-DIAG-02 — ATM-W-INVALID-CSS-VALUE reproduces through the whole compiler as warning

Boolean or null where CSS needs a value. The world carries a minimal theme fixture on the diagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: the atomic unit resolver. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: ATM-W-INVALID-CSS-VALUE (the diagnostic registry inventory + the shared repro suite row).

> Search terms: ATM-W-INVALID-CSS-VALUE, atm-w-invalid-css-value, diagnostics case index, CORE-DIAG-02

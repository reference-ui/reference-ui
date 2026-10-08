# NEO-DIAG-02 — ATM-W-INVALID-CSS-VALUE reproduces through the whole compiler as warning

Boolean or null where CSS needs a value. The world carries the minimal fixture (theme/warn.ts) on the diagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/resolve/unit.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-W-INVALID-CSS-VALUE (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-W-INVALID-CSS-VALUE, atm-w-invalid-css-value, diagnostics case index, NEO-DIAG-02

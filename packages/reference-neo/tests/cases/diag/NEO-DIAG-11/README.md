# NEO-DIAG-11 — ATM-W-STATIC-WILDCARD reproduces through the whole compiler as warning

Wildcard on a prop with no token category. The world carries only config plus the brand token on the diagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/static_css.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-W-STATIC-WILDCARD (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-W-STATIC-WILDCARD, atm-w-static-wildcard, diagnostics case index, NEO-DIAG-11

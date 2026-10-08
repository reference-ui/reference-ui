# NEO-DIAG-10 — ATM-W-UNTERMINATED-BRACE reproduces through the whole compiler as warning

Unterminated `{` inside a value. The world carries the minimal fixture (theme/brace.ts) on the diagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/resolve/tokens/interpolate.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-W-UNTERMINATED-BRACE (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-W-UNTERMINATED-BRACE, atm-w-unterminated-brace, diagnostics case index, NEO-DIAG-10

# NEO-DIAG-08 — ATM-W-NON-CANONICAL-NUMERIC reproduces through the whole compiler as warning

Octal, hex, binary, `Infinity`, or `NaN` numeric spelling. The world carries the minimal fixture (theme/num.ts) on the diagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/resolve/unit.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-W-NON-CANONICAL-NUMERIC (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-W-NON-CANONICAL-NUMERIC, atm-w-non-canonical-numeric, diagnostics case index, NEO-DIAG-08

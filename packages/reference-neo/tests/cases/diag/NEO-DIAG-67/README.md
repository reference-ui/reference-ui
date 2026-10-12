# NEO-DIAG-67 — ATM-W-UNKNOWN-TONE reproduces through the whole compiler as warning

A bare `base/tone` whose tone name is not declared: `brand/mediun` on a background, with `medium` declared beside it. The world carries the minimal fixture (theme/tone.ts) plus a tokens file that declares the colour and one tone, on the diagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity and a non-blank message that names the unknown tone, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/resolve/tokens/mod.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-W-UNKNOWN-TONE (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-W-UNKNOWN-TONE, atm-w-unknown-tone, diagnostics case index, NEO-DIAG-67

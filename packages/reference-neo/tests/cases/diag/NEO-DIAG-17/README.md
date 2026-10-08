# NEO-DIAG-17 — ATM-E-RECIPE-SPREAD reproduces through the whole compiler as error

Spread inside a `recipe(...)` object literal. The world carries the minimal fixture (theme/recipe-spread.ts) on the diagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with error severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/extract/recipes/mod.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-E-RECIPE-SPREAD (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-E-RECIPE-SPREAD, atm-e-recipe-spread, diagnostics case index, NEO-DIAG-17

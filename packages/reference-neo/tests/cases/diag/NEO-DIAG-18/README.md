# NEO-DIAG-18 — ATM-E-RECIPE-CLASSNAME reproduces through the whole compiler as error

Missing or dynamic recipe className. The world carries the minimal fixture (theme/recipe-name.ts) on the diagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with error severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/extract/recipes/mod.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-E-RECIPE-CLASSNAME (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-E-RECIPE-CLASSNAME, atm-e-recipe-classname, diagnostics case index, NEO-DIAG-18

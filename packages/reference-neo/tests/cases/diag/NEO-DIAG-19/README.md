# NEO-DIAG-19 — ATM-E-DUPLICATE-RECIPE reproduces through the whole compiler as error

Two recipes claim one className within a system. The world carries the minimal fixture (theme/recipe-dup.ts) on the diagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with error severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/assembly.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-E-DUPLICATE-RECIPE (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-E-DUPLICATE-RECIPE, atm-e-duplicate-recipe, diagnostics case index, NEO-DIAG-19

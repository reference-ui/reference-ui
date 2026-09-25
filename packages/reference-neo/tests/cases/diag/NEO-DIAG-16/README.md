# NEO-DIAG-16 — ATM-E-RECIPE-ARG-SHAPE reproduces through the whole compiler as error

`recipe(...)` first arg is not an inline object. The world carries the minimal fixture (theme/recipe-arg.ts) on the diagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with error severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/extract/recipes/mod.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-E-RECIPE-ARG-SHAPE (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-E-RECIPE-ARG-SHAPE, atm-e-recipe-arg-shape, diagnostics case index, NEO-DIAG-16

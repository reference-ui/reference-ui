# NEO-DIAG-60 — TGN-W-INVALID-RECIPE-NAME reproduces through the whole compiler as warning

A recipe name that cannot PascalCase to a TypeScript identifier; the recipe is omitted. The world carries the minimal base-system spec as spec.json. The spec drives the whole typegen printer (`emitDtsDetailed` over the case spec) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/typegen/src/diagnostics/collect.rs`. Driver: the whole typegen printer (`emitDtsDetailed` over the case spec).

Evidence: `[diag]` TGN-W-INVALID-RECIPE-NAME (REGISTRY.md inventory + the shared repro suite row).

> Search terms: TGN-W-INVALID-RECIPE-NAME, tgn-w-invalid-recipe-name, diagnostics case index, NEO-DIAG-60

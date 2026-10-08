# NEO-DIAG-61 — TGN-W-EMPTY-RECIPE reproduces through the whole compiler as warning

A recipe with no printable variant axes, or one empty axis; skipped at the reported scope. The world carries the minimal base-system spec as spec.json. The spec drives the whole typegen printer (`emitDtsDetailed` over the case spec) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/typegen/src/diagnostics/collect.rs`. Driver: the whole typegen printer (`emitDtsDetailed` over the case spec).

Evidence: `[diag]` TGN-W-EMPTY-RECIPE (REGISTRY.md inventory + the shared repro suite row).

> Search terms: TGN-W-EMPTY-RECIPE, tgn-w-empty-recipe, diagnostics case index, NEO-DIAG-61

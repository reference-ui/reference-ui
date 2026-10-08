# NEO-DIAG-63 — TGN-W-UNKNOWN-STRICT-CATEGORY reproduces through the whole compiler as warning

A strict name outside colors/radii/spacing; skipped with a near-match nudge. The world carries the minimal base-system spec as spec.json plus strict.json. The spec drives the whole typegen printer (`emitDtsDetailed` over the case spec) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/typegen/src/diagnostics/collect.rs`. Driver: the whole typegen printer (`emitDtsDetailed` over the case spec).

Evidence: `[diag]` TGN-W-UNKNOWN-STRICT-CATEGORY (REGISTRY.md inventory + the shared repro suite row).

> Search terms: TGN-W-UNKNOWN-STRICT-CATEGORY, tgn-w-unknown-strict-category, diagnostics case index, NEO-DIAG-63

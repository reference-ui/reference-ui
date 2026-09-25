# NEO-DIAG-64 — TGN-W-ABSENT-STRICT-CATEGORY reproduces through the whole compiler as warning

A known strict category with no tokens in this system; no wrapper is printed. The world carries the minimal base-system spec as spec.json plus strict.json. The spec drives the whole typegen printer (`emitDtsDetailed` over the case spec) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/typegen/src/diagnostics/collect.rs`. Driver: the whole typegen printer (`emitDtsDetailed` over the case spec).

Evidence: `[diag]` TGN-W-ABSENT-STRICT-CATEGORY (REGISTRY.md inventory + the shared repro suite row).

> Search terms: TGN-W-ABSENT-STRICT-CATEGORY, tgn-w-absent-strict-category, diagnostics case index, NEO-DIAG-64

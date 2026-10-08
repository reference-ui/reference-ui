# NEO-DIAG-62 — TGN-W-INVALID-COMPOUND-VARIANT reproduces through the whole compiler as warning

A compound row naming an unknown axis or value; the row is skipped. The world carries the minimal base-system spec as spec.json. The spec drives the whole typegen printer (`emitDtsDetailed` over the case spec) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/typegen/src/diagnostics/collect.rs`. Driver: the whole typegen printer (`emitDtsDetailed` over the case spec).

Evidence: `[diag]` TGN-W-INVALID-COMPOUND-VARIANT (REGISTRY.md inventory + the shared repro suite row).

> Search terms: TGN-W-INVALID-COMPOUND-VARIANT, tgn-w-invalid-compound-variant, diagnostics case index, NEO-DIAG-62

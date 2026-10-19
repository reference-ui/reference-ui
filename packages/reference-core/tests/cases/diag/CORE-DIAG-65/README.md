# CORE-DIAG-65 — TGN-W-EMPTY-FONT-FAMILY reproduces through the whole compiler as warning

A font family declaring no weights; omitted from the registry. The world carries the minimal base-system spec as a spec input. The spec drives the whole typegen printer (`emitDtsDetailed` over the case spec) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: typegen diagnostic collection. Driver: the whole typegen printer (`emitDtsDetailed` over the case spec).

Evidence: TGN-W-EMPTY-FONT-FAMILY (the diagnostic registry inventory + the shared repro suite row).

> Search terms: TGN-W-EMPTY-FONT-FAMILY, tgn-w-empty-font-family, diagnostics case index, CORE-DIAG-65

# CORE-DIAG-59 — TGN-W-UNKNOWN-TOKEN-CATEGORY reproduces through the whole compiler as warning

A dump token category with no printed union; its tokens are omitted. The world carries the minimal base-system spec as a spec input. The spec drives the whole typegen printer (`emitDtsDetailed` over the case spec) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: typegen diagnostic collection. Driver: the whole typegen printer (`emitDtsDetailed` over the case spec).

Evidence: TGN-W-UNKNOWN-TOKEN-CATEGORY (the diagnostic registry inventory + the shared repro suite row).

> Search terms: TGN-W-UNKNOWN-TOKEN-CATEGORY, tgn-w-unknown-token-category, diagnostics case index, CORE-DIAG-59

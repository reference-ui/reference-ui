# CORE-DIAG-54 — ATL-W-UNRESOLVED-INCLUDE-PACKAGE reproduces through the whole compiler as warning

Included package resolves nowhere; the package is skipped. The world carries a minimal Ok app with analyzer config {"include":["@fixtures/missing-ui"]}. The spec drives the whole atlas analyzer (`analyzeAtlasDetailed` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: the atlas analyzer. Driver: the whole atlas analyzer (`analyzeAtlasDetailed` over the case world).

Evidence: ATL-W-UNRESOLVED-INCLUDE-PACKAGE (the diagnostic registry inventory + the shared repro suite row).

> Search terms: ATL-W-UNRESOLVED-INCLUDE-PACKAGE, atl-w-unresolved-include-package, diagnostics case index, CORE-DIAG-54

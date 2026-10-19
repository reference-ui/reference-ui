# CORE-DIAG-55 — ATL-E-SCAN-FAILED reproduces through the whole compiler as error

File discovery or read failed; the analysis is refused with empty components. The world carries a minimal Ok app with analyzer config {"exclude":["["]}. The spec drives the whole atlas analyzer (`analyzeAtlasDetailed` over the case world) and asserts the code with error severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: the atlas analyzer. Driver: the whole atlas analyzer (`analyzeAtlasDetailed` over the case world).

Evidence: ATL-E-SCAN-FAILED (the diagnostic registry inventory + the shared repro suite row).

> Search terms: ATL-E-SCAN-FAILED, atl-e-scan-failed, diagnostics case index, CORE-DIAG-55

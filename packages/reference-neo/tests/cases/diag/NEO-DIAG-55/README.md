# NEO-DIAG-55 — ATL-E-SCAN-FAILED reproduces through the whole compiler as error

File discovery or read failed; the analysis is refused with empty components. The world carries the minimal app (src/components/Ok.tsx) with analyzer config {"exclude":["["]}. The spec drives the whole atlas analyzer (`analyzeAtlasDetailed` over the case world) and asserts the code with error severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atlas/src/analyzer.rs`. Driver: the whole atlas analyzer (`analyzeAtlasDetailed` over the case world).

Evidence: `[diag]` ATL-E-SCAN-FAILED (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATL-E-SCAN-FAILED, atl-e-scan-failed, diagnostics case index, NEO-DIAG-55

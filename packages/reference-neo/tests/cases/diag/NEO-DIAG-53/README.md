# NEO-DIAG-53 — ATL-W-UNSUPPORTED-PROPS-ANNOTATION reproduces through the whole compiler as warning

Inline props object annotation; the component is omitted from the inventory. The world carries the minimal app (src/components/InlineBadge.tsx). The spec drives the whole atlas analyzer (`analyzeAtlasDetailed` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atlas/src/resolver.rs`. Driver: the whole atlas analyzer (`analyzeAtlasDetailed` over the case world).

Evidence: `[diag]` ATL-W-UNSUPPORTED-PROPS-ANNOTATION (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATL-W-UNSUPPORTED-PROPS-ANNOTATION, atl-w-unsupported-props-annotation, diagnostics case index, NEO-DIAG-53

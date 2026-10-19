# CORE-DIAG-52 — ATL-W-UNRESOLVED-PROPS-TYPE reproduces through the whole compiler as warning

Named props type resolves nowhere; a partial component is kept with empty props. The world carries a minimal BrokenCard app. The spec drives the whole atlas analyzer (`analyzeAtlasDetailed` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: the atlas props resolver. Driver: the whole atlas analyzer (`analyzeAtlasDetailed` over the case world).

Evidence: ATL-W-UNRESOLVED-PROPS-TYPE (the diagnostic registry inventory + the shared repro suite row).

> Search terms: ATL-W-UNRESOLVED-PROPS-TYPE, atl-w-unresolved-props-type, diagnostics case index, CORE-DIAG-52

# CORE-DIAG-66 — TGN-E-INVALID-BASE-SYSTEM reproduces through the whole compiler as error

The baseSystem spec failed contract validation; the request is refused as a coded throw. The world carries a base-system spec with a bad schema version as a spec input. The spec drives the whole typegen printer over a bad base system (coded throw) and asserts the code with error severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: the typegen native bridge. Driver: the whole typegen printer over a bad base system (coded throw).

Evidence: TGN-E-INVALID-BASE-SYSTEM (the diagnostic registry inventory + the shared repro suite row).

> Search terms: TGN-E-INVALID-BASE-SYSTEM, tgn-e-invalid-base-system, diagnostics case index, CORE-DIAG-66

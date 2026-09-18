# NEO-COND-13 — unknown `_hovr` yields a warning, no utility, no ghost class, and sync still succeeds

The world calls `css()` with an unknown `_hovr` arm plus a base ink
sibling on one paragraph. The spec checks the sheet carries exactly the
sibling utility with no `hovr` anywhere, the paragraph's class string
carries the one compiled class and no ghost, and the paragraph paints
ink — while the run's green sync hook is itself the proof that sync
still succeeds past the warning.

Evidence: `[atm]` ATM-COND-12 (R1 probe
`/tmp/cond-batch4-r1/probe.mjs` captures the warning text `Unknown
condition "_hovr"` with the sibling still compiling to one atom).

> Search terms: typo, invalid condition, graceful degradation, fallback, hovr typo, diagnostics/unknown-condition, sync/recovery

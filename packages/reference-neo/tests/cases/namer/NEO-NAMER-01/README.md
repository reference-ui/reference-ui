# NEO-NAMER-01 — the runtime namer equals the compiled plans on every engine input

The spec recompiles every engine case input through the native compiler
and runs the runtime namer over each authored declaration, requiring
byte-equal slot and className lists against the compiled plans. Refused
declarations must yield nothing or a class absent from the sheet. The
compiler namer is the oracle; this differential gate is what holds the
mirror equal to it as both evolve.

Evidence: `[atm]` SEAM (`packages/reference-rs/modules/atomic/tests/cases/ATM-SEAM-08`); station `packages/reference-rs/modules/atomic/tests/cases/ATM-NAME-08`.

> Search terms: differential gate, runtime namer, compiler namer, oracle, plan parity, byte-equal declarations, refused declarations, namer mirror, engine corpus

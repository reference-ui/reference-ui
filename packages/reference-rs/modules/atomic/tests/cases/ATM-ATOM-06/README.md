# ATM-ATOM-06 — Custom-prop shape

Scalar, array, and object custom properties all compile as declarations.
The object form mints one whole-object `--x` plan with per-breakpoint
declarations, and analysis predicts that same whole-object lookup — never
nested `base`/`md` exacts under `['--x']`. Contract: [SPEC.md](../../../SPEC.md).

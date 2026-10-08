# ATM-SCAN-01

The frozen request's `include` globs scope the `sourceRoot` scan and the legacy virtual `files` list: under `include: ['theme/**']` the `css()` in `outside/` yields no utility and no diagnostics, while an absent or empty include still scans everything. A negation-only include (e.g. `['!outside/**']`) scopes to scan-all-minus-negatives.
Contract: [SPEC.md](../../../SPEC.md).

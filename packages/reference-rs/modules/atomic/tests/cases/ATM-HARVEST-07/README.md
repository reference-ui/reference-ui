# ATM-HARVEST-07 — Color token-license station

The color token-license arm. The pool holds two named colors the system
declares as `colors` tokens plus one undeclared shade, and a dynamic
`color` site sinks: only the declared token names mint onto the sink (the
tokenless `ATM-HARVEST-06` cannot), while the undeclared word still never
mints a color. One `ATM-I-HARVEST-SINK` info counts 2.
Symbols: `HarvestPool`, `Sink`, `is_allowlisted_color`, `token_category`, `HarvestSink`.
Siblings: `ATM-HARVEST-06` (the tokenless allowlist), `ATM-HARVEST-01` (the floor), `ATM-HARVEST-04` (zero-harvest control).
Contract: [SPEC.md](../../../SPEC.md).

> Search terms: color token license, declared color token mints, token_category, undeclared named color, harvest allowlist arm

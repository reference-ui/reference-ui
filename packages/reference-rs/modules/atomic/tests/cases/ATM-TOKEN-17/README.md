# ATM-TOKEN-17

Negation distributes over explicit braced lookups: `-{spacing.4}` calc-wraps silently, opacity composes in either brace position (`-{path/50}`, `-{path}/50`), `-{unknown.path}` fails closed with an error plus a dropped declaration, and the `-1px solid {colors…}` composite keeps interpolation with no calc-wrap.
Symbols: `resolve_negated_token`, `resolve_negated_braced`, `DiagnosticCode::UnknownTokenReference`.
Siblings: `ATM-TOKEN-07` (the bare negation path), `ATM-TOKEN-12` (the fail-closed parity), `ATM-TOKEN-08` (composite interpolation).
Contract: [SPEC.md](../../../SPEC.md).

> Search terms: negated braced token, calc wrap, negation distributes, opacity position, color-mix, unknown token reference

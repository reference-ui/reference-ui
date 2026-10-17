# ATM-TOKEN-16 — Bare-value (§11)

A bare miss warns on its own prop family: `color="md"` warns unknown-color, `fontSize="sm"` warns unknown-token because no font-size token is named `sm` (the baseSystem declares none), and `borderRadius="sm"` still resolves `var(--radii-sm)` — the cross-category radii story is retired.
Symbols: `warn_unresolved_token`, `warn_unknown_color`, `warn_unknown_token_name`, `DiagnosticCode::UnknownColor`, `DiagnosticCode::UnknownToken`.
Siblings: `ATM-TOKEN-09` (the retired mismatch pin), `ATM-TOKEN-14` (§9 fence), `ATM-TOKEN-15` (radii category), `ATM-TOKEN-24` and `ATM-TOKEN-25` (the length-category warning and its silent keywords).
Contract: [SPEC.md](../../../SPEC.md).

> Search terms: unique name, cross-category, unknown color, bare value, TokenCategoryMismatch retired, fontSize sm

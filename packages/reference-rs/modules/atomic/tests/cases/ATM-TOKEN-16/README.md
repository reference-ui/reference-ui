# ATM-TOKEN-16

Bare values never warn off color props: `fontSize="sm"` passes `sm` through silently, `color="md"` warns unknown-color, and `borderRadius="sm"` still resolves `var(--radii-sm)` — the cross-category radii story is retired.
Symbols: `warn_unresolved_token`, `warn_unknown_color`, `DiagnosticCode::UnknownColor`.
Siblings: `ATM-TOKEN-09` (the retired mismatch pin), `ATM-TOKEN-14` (§9 fence), `ATM-TOKEN-15` (radii category).
Contract: [SPEC.md](../../../SPEC.md).

> Search terms: unique name, cross-category, unknown color, bare value, TokenCategoryMismatch retired, fontSize sm

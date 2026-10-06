# ATM-TOKEN-18

`{category.path}` refs embedded in a composite token value expand to `var(--…)`
inside `@layer tokens`, light and dark blocks alike — the tokens-layer half of
the `ATM-TOKEN-08` utility interpolation contract. A `color-mix(in oklch,
{colors.gray.900} 72%, transparent)` dark override emits the `var(--…)` form;
whole-value aliases keep working; resolved refs stay silent.
Symbols: `css_token_value`, `expand_token_refs`, `expand_brace_segments`.
Siblings: `ATM-TOKEN-08` (utility composite interpolation), `ATM-TOKEN-11`
(whole-value tokens-layer alias), `ATM-TOKEN-12` (unknown-ref diagnostics).
Contract: [SPEC.md](../../../SPEC.md).

> Search terms: composite token value, tokens layer, brace expansion, color-mix, dark override, embedded reference

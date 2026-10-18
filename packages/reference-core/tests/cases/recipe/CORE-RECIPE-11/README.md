# CORE-RECIPE-11 — A `recipe()` with no `className` prop emits paintable classes under its `<Name>Recipe` binding

The world defines one `chipRecipe` with base, two tones, and a default, and no
`className` prop, then paints two probes with the emitted closed classes. The
spec checks sync admits it as `core-recipe__chip`, the runtime table resolves
both tones plus the default exactly like an explicit identity, and both probes
paint in the browser.

Scope note: the runtime `recipe()` lookup still keys on an explicit
`className`, so a nameless config cannot self-resolve at runtime — the case
proves the inferred emission (extraction parity), not nameless runtime lookup.
Retired reference-core parity: `@reference-ui/lib` ships `summaryChipRecipe` with no prop, which
the retired reference-core admitted as `summaryChip` (RS-33); the retired reference-core's own runtime resolved that call
through atoms, never the named table.

Evidence: ATM-RECIPE-08; reference-lib `SummaryChip.tsx` (RS-33).

> Search terms: inferred className, implicit identity, binding name, export name, recipe/identity, recipe/inference, CORE-RECIPE-06

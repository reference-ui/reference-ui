# NEO-RECIPE-11 — A `recipe()` with no `className` prop emits paintable classes under its `<Name>Recipe` binding

The world defines one `chipRecipe` with base, two tones, and a default, and no
`className` prop, then paints two probes with the emitted closed classes. The
spec checks sync admits it as `neo-recipe__chip`, the runtime table resolves
both tones plus the default exactly like an explicit identity, and both probes
paint in the browser.

Scope note: the runtime `recipe()` lookup still keys on an explicit
`className`, so a nameless config cannot self-resolve at runtime — the case
proves the inferred emission (extraction parity), not nameless runtime lookup.
Core parity: `@reference-ui/lib` ships `summaryChipRecipe` with no prop, which
core admitted as `summaryChip` (RS-33); core's own runtime resolved that call
through atoms, never the named table.

Evidence: `[atm]` ATM-RECIPE-08; `[lib]` `SummaryChip.tsx` (RS-33).

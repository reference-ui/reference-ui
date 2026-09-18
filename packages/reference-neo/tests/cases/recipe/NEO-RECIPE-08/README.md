# NEO-RECIPE-08 — Responsive variant value `{ base: 'solid', md: 'outline' }` switches at the container width

The world defines one `swatch` recipe with a `variant` axis and selects it
with `{ variant: { base: 'solid', md: 'outline' } }`. The spec checks the
table carries the per-breakpoint map, the call emits the base combination
plus the `md:` class, the sheet wraps the `md` rule in its container query
after the plain rules, and resizing the live container across 768px flips
the painted background and color.

Evidence: `[panda-v1]` `core/__tests__/recipe.test.ts:226` responsive
variant; `[atm]` ATM-RECIPE-07.

> Search terms: @container, viewport resize, mobile-first, recipe/responsive, recipe/breakpoints, NEO-RECIPE-01

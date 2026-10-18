# CORE-RECIPE-08 — Responsive variant value `{ base: 'solid', md: 'outline' }` switches at the container width

The world defines one `swatch` recipe with a `variant` axis and selects it
with `{ variant: { base: 'solid', md: 'outline' } }`. The spec checks the
table carries the per-breakpoint map, the call emits the base combination
plus the `md:` class, the sheet wraps the `md` rule in its container query
after the plain rules, and resizing the live container across 768px flips
the painted background and color.

Evidence: Panda v1 recipe tests (responsive variant); ATM-RECIPE-07.

> Search terms: @container, viewport resize, mobile-first, recipe/responsive, recipe/breakpoints, CORE-RECIPE-01

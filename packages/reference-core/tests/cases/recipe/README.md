# CORE-RECIPE — variants and identity

Proves one recipe is a closed set of classes in `@layer recipes` plus a runtime variant table, with the browser proving selection paints: base, variant axes, `defaultVariants`, boolean axes, compounds, `_hover` leaves, `raw()` equivalence, owner-qualified identity, and the utilities-beat-recipes cascade. Goldens prove strings; these cases prove paint. `SPEC.md` carries the recipe contract; `TESTS.md` is the case ledger.

> Search terms: recipe variants, closed classes, variant table, defaultVariants, compound variants, recipe identity, raw equivalence, utilities beat recipes

## Cases

- CORE-RECIPE-01 — recipe variants resolve to closed classes.
- CORE-RECIPE-02 — `defaultVariants` apply when a variant is omitted.
- CORE-RECIPE-03 — boolean variants `true`/`false` select distinct classes.
- CORE-RECIPE-04 — compound variants emit after simple variants and require every predicate.
- CORE-RECIPE-05 — `recipe(...).raw(props)` returns a style object that `css()` paints identically.
- CORE-RECIPE-06 — recipe class identity is `${system}__${className}`, and a duplicate fails sync.
- CORE-RECIPE-07 — a non-object-literal recipe fails sync with a located diagnostic.
- CORE-RECIPE-08 — responsive variant value `{ base: 'solid', md: 'outline' }` switches at the container width.
- CORE-RECIPE-09 — `_hover` inside a variant paints on the variant class, not a separate atom.
- CORE-RECIPE-10 — variant + `css()` utilities on the same node: utilities win via layer order.
- CORE-RECIPE-11 — a `recipe()` with no `className` prop emits paintable classes under its `<Name>Recipe` binding.
- CORE-RECIPE-12 — one recipe class paints its `@media` and `@container` branches together.

Parent: [tests/cases/](../README.md).

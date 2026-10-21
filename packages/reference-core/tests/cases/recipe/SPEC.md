# RECIPE — variants and identity

## Purpose

One recipe is a closed set of classes in `@layer recipes` plus a runtime
variant table. The browser proves selection paints: base, variant axes,
`defaultVariants`, boolean axes, compounds, `_hover` leaves, `raw()`
equivalence, owner-qualified identity, and the utilities-beat-recipes
cascade. Goldens prove strings; these cases prove paint.

## Dialect

Authors write `recipe({ className, base, variants, defaultVariants,
compoundVariants })` and call the bound helper with plain props
(`string | boolean | number`) or per-axis responsive objects like
`{ base: 'solid', md: 'outline' }` (ATM-RECIPE-07). With `slots: ['root', 'title']`,
`base`, each variant value and each compound `css` are keyed by slot, and the call
returns one class string per slot (CORE-RECIPE-13). A slot key the list does not
name, a malformed list, or a slot stem (`card__root`) another recipe claims fails
sync (CORE-RECIPE-14).
`recipe(...).raw(props)` returns the merged style object for `css()`.
`className` is required and explicit; duplicates in one system fail sync.
A missing table resolves to `''`; dev warns once per qualified key, production stays silent.

## Reference-rs cases

All confirmed by `ls` + README under
`packages/reference-rs/modules/atomic/tests/cases/`:

| Reference-rs case | Proves |
| --- | --- |
| ATM-RECIPE-01 | Variant leaves compile to closed classes in `@layer recipes`, never utilities |
| ATM-RECIPE-02 | `CompileResult` carries the authoritative variant table; runtime consumes it |
| ATM-RECIPE-03 | Host StyleProps stay utilities; utilities layer follows recipes, so overrides win |
| ATM-RECIPE-04 | `defaultVariants` + boolean `true`/`false` axes in table and sheet |
| ATM-RECIPE-05 | Compound rules print after simple variant rules (source order wins) |
| ATM-RECIPE-06 | Strict identity: literal `className`, no spreads/non-objects, dup `(system, className)` is a diagnostic |
| ATM-RECIPE-07 | Responsive selections compile to per-breakpoint classes in `@container` queries plus the runtime map (RS-8) |
| ATM-RECIPE-10 | A slotted recipe lowers to one closed recipe per slot (`{className}__{slot}`) sharing one call-site gate |
| ATM-RECIPE-11 | Slot refusals: unknown slot keys, malformed lists, slot-stem and className collisions |
| ATM-LAYER-04 | Utility rules (and at-rule wrappers) live in `@layer utilities` (for RECIPE-10) |

Extract of `base`/variant/`compoundVariants[].css` leaves is ATM-SITE-03;
`sva`/`tw`/`cx` extract nothing (ATM-SITE-04). ATM-LAYER-01 is a standing
gauge, not a folder — nothing here cites it. Responsive variant values
(`{ base, md }`) are covered by ATM-RECIPE-07 (RS-8).

## Decisions

- No `cva` export; `recipe` only (zero lib call sites).
- Multi-part components take a `slots` key on `recipe()`, lowered to one
  recipe per slot; there is no `sva` helper. Lib components still author
  global CSS + `data-slot`.
- `css.raw` not shipped; `recipe(...).raw()` is shipped.
- When RS-8 lands, responsive variants lower to `@container`,
  never Panda's `@media screen`.

## Approved absences

- Slot recipes / `sva`: no `sva()` helper and no `recipes.slots` layer;
  `recipe({ slots })` compiles each slot into the flat `recipes` layer
  (ATM-RECIPE-10). `sva(` stays an unknown helper (ATM-SITE-04).
- `cva` name: react entry exports `recipe` only.
- `recipes._base` inner-layer spelling: Reference layers stay flat
  (`reset, global, base, tokens, recipes, utilities`); Panda's
  `@layer recipes { @layer _base }` nesting is not reproduced.
- Panda static recipe expansion: Panda emits every boolean arm
  (`.d_block` + `.d_none`) at definition time; Reference compiles closed
  classes once and selects via the runtime table (ATM-RECIPE-02).

## Out-of-scope (not Reference's dialect)

| Panda feature | Reason |
| --- | --- |
| `sva()` / slot recipes as a separate helper / `@layer recipes.slots` | `recipe({ slots })` instead, in the flat `recipes` layer |
| `cva` export name |; `recipe` only |
| `recipes._base` / nested recipe layers | Flat six-layer sheet (§4.4) |
| Static expansion of all variant combos at definition | Runtime table selection instead |
| `staticCss.recipes` cartesian pre-emit | STATIC group scope, not recipe selection |
| Const-bound `recipe(definition)` indirection | Out of engine cutover (engine PLAN); authors pass literals |

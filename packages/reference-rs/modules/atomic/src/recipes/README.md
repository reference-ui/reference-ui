# Recipes

`cva` / `sva` are a **closed** set. Compile them to one class per
declared variant (and compound) in `@layer recipes`. That hash/name is
fine: the table is enumerable at build, runtime only picks a declared
key.

Style props on a recipe host are still **atoms**. `{ ...recipe, mt: '2r' }`
is composition. Do not bake `mt` into `Button_solid_a3f2` or runtime
cannot add `mt` the compiler did not see on that variant.

## Files (when coded)

- `mod.rs` — `compile_recipe(def) ->` recipe classes + variant table
- `cva.rs`, `sva.rs`, `compound.rs`

## Panda

`vendor/panda/crates/pandacss_recipes/src/lib.rs` — `Recipe` /
`SlotRecipe` / `from_literal`. Encode: `encoder` `process_atomic_recipe`.
Sheet: `@layer recipes` in `pandacss_stylesheet`. Runtime:
`codegen/src/artifacts/{cva,sva,recipes}.rs`.

## Must not

- Require authors to drop StyleProps.
- Hash StyleProps into the recipe class.

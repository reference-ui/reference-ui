# Recipes

Closed `recipe()` emit. Extract already found the call; this module
turns that IR into scoped `@layer recipes` rules and a JSON variant table.
Evaluated-spec theme recipes (`spec.recipes`, keyed by explicit `className`)
lower through the same matrix: same qualified stems, same cartesian tables.

Open `css()` stays atomic utilities with `stylesheet::name`. A recipe is
a finished matrix: base, each variant value, and each compound get a
qualified class (`${system}__${className}__base`, `${system}__${className}_...`,
`${system}__${className}_c_...`), plus one `{breakpoint}:`-prefixed class per
width breakpoint for each variant value, wrapped in that breakpoint's
`@container` query. Runtime `recipe()` (authored TypeScript)
looks up the pre-composed combinations in `RecipeRuntimeTable` (`base`
selections read `variantMap`, other breakpoints read `responsiveVariantMap`).
It does not re-walk style objects and it does not evaluate author JS at runtime.

Host StyleProps on `<Button mt="2r" />` never enter these classes. They
remain utilities. `@layer utilities` follows `@layer recipes`, so those
overrides win naturally by cascade ordering. `sva` is not an author API.

## Must not

- Hash a whole recipe object into `.css-1a2b3c`.
- Feed recipe leaves into the utility AtomSet.
- Invent a slot-recipe / `sva` helper.
- Call `stylesheet::name` for these classes.
- Fall back to variable binding names for recipe identity.

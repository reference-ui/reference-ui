# Recipes

Closed `recipe()` emit. Extract already found the call; this module
turns that IR into scoped `@layer recipes` rules and a JSON variant table.
Evaluated-spec theme recipes (`spec.recipes`, keyed by explicit `className`)
lower through the same matrix: same qualified stems, same cartesian tables.

A slotted `recipe()` arrives already lowered: extraction emits one plain recipe per slot under `{className}__{slot}`, so each slot gets its own qualified stem, closed classes and runtime table through the same matrix. Slot recipes of one call share that call's gate (`Recipe::selection_name`). Identity claims refuse a className two calls claim and a stem two recipes claim, so a plain `card__root` beside slot `root` of `card` fails.

Open `css()` stays atomic utilities with `stylesheet::name`. A recipe is
a finished matrix: base, each variant value, and each compound get a
qualified class (`${system}__${className}__base`, `${system}__${className}_...`,
`${system}__${className}_c_...`), plus one `{breakpoint}:`-prefixed class per
width breakpoint for each variant value, wrapped in that breakpoint's
`@container` query. Runtime `recipe()` (authored TypeScript)
derives `base` plus variant and compound classes from the qualified stem
and the per-axis value-name lists (`{stem}__base`,
`{stem}_{axis[0]}_{value}`), with other breakpoints deriving
`{breakpoint}:`-prefixed classes gated on `responsiveBreakpoints`).
It does not re-walk style objects and it does not evaluate author JS at runtime.

Host StyleProps on `<Button mt="2r" />` never enter these classes. They
remain utilities. `@layer utilities` follows `@layer recipes`, so those
overrides win naturally by cascade ordering. `sva` is not an author API.

## Must not

- Hash a whole recipe object into `.css-1a2b3c`.
- Feed recipe leaves into the utility AtomSet.
- Invent a separate slot helper (`sva`): slots are a `recipe()` key that lowers before this stage.
- Call `stylesheet::name` for these classes.
- Fall back to variable binding names for recipe identity.

# Recipes

Closed `recipe()` emit. Extract already found the call; this module
turns that IR into `@layer recipes` classes and a JSON variant table.

Open `css()` stays atomic utilities with `stylesheet::name`. A recipe is
a finished matrix: base, each variant value, and each compound get one
readable class (`button`, `button--variant_solid`). Runtime `recipe()`
(authored TypeScript) looks up the table. It does not re-walk style
objects and it does not evaluate author JS.

Host StyleProps on `<Button mt="2r" />` never enter these classes. They
remain utilities. `@layer utilities` follows `@layer recipes`, so those
overrides win. `sva` is not an author API.

## Must not

- Hash a whole recipe object into `.css-1a2b3c`.
- Feed recipe leaves into the utility AtomSet.
- Invent a slot-recipe / `sva` helper.
- Call `stylesheet::name` for these classes.

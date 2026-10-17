# NEO-TYPE-03 — recipe variants are optional literal unions, enforced at the call

After `sync()`, a `recipe()` selection types every axis as an optional literal
union: the positive consumer assigns `{ tone: 'accent', size: 'lg' }` through
`RecipeVariantProps<typeof button>` and through a direct call, while
`button({ tone: 'bogus' })` is TS2322. The unions are plain per TYP-RECIPE-01,
never `ConditionalValue`-wrapped. The world is the TYPE-01 token set plus the
tone/size recipe; the spec pins the committed `paths` mapping, typechecks a
positive and a negative temp consumer, asserts the generated `react.d.mts`
mentions no `ConditionalValue`, and asserts the recipe probe paints.

The consumers are materialized at spec time because they cannot live in the
repo: the harness pre-run typecheck resolves `@reference-ui/react` to the
stable surface, which has no `RecipeVariantProps`. The engine prints plain unions for a declared recipe
table; the host call position (`RecipeRuntimeFn` methods take
`RecipeVariantProps<RecipeRuntimeFn<TConfig>>`) makes the direct call infer
literal axes instead of the wide record fallback.

Evidence: Panda v1 generate-recipe tests (contrast:
`ConditionalValue`); typegen golden `recipes.d.ts`; TYP-RECIPE-01.

> Search terms: cva, autocomplete, intellisense, typo, type/recipe-variants, type/negative-typecheck, NEO-TYPE-01, NEO-TYPE-02

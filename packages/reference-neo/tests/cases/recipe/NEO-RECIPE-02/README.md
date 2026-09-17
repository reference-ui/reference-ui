# NEO-RECIPE-02 — `defaultVariants` apply when a variant is omitted

The world defines one `card` recipe with `size` and `tone` axes plus
`defaultVariants` for both. The spec checks the table carries the defaults,
bare and partial calls resolve through them, and each node paints the
defaulted axis: computed height from the default size, computed color from
the default tone.

Evidence: `[panda-v1]` `core/__tests__/recipe.test.ts:104` defaults; `[atm]`
ATM-RECIPE-04 (P2 #17).

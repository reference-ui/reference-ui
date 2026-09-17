# NEO-RECIPE-09 — `_hover` inside a variant paints on the variant class, not a separate atom

The world defines one `chip` recipe whose `loud` tone carries a `_hover`
background arm. The spec checks the hover rule hangs off the variant class,
no utility is emitted, and hovering the loud probe paints the arm while the
quiet probe never paints it.

Evidence: `[panda-v1]` `core/__tests__/recipe.test.ts:220` solid hover;
`[atm]` ATM-RECIPE-02.

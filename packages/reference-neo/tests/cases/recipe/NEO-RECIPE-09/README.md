# NEO-RECIPE-09 — `_hover` inside a variant paints on the variant class, not a separate atom

The world defines one `chip` recipe whose `loud` tone carries a `_hover`
background arm. The spec checks the hover rule hangs off the variant class,
no utility is emitted, and hovering the loud probe paints the arm while the
quiet probe never paints it.

Evidence: Panda v1 recipe tests (solid hover); ATM-RECIPE-02.

> Search terms: pseudo-class arm, :hover, state arm, interactive tone, recipe/pseudo-classes, recipe/hover, NEO-RECIPE-01

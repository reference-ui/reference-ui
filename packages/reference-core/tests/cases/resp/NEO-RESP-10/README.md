# NEO-RESP-10 — the viewport contract: width, height, and mixed branches gate per query

The world emits three classes: a `css()` viewport-width branch at
800px, a recipe viewport-height branch at 700px, and one mixed `css()`
class carrying both a 260px container branch (padding + background)
and an 800px viewport branch (top border). Narrow (220px) and wide
(320px) container shells host the mixed probes. The spec replays all
eight oracle legs: css width below/above, recipe height below/above,
and the four mixed cells (narrow/wide × below/above), each asserting
exactly its active branches.

Matrix source: `matrix/responsive/tests/e2e/viewport-contract.spec.ts`
(whole file, 8 tests) + `matrix/responsive/src/styles.ts`
(`viewportCss`, `responsiveViewportRecipe`, `mixedCss`).

> Search terms: viewport contract, media width, media height, mixed container viewport, responsive-mixed, NEO-RESP-10

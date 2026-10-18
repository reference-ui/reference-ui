# NEO-RECIPE-12 — one recipe class paints its `@media` and `@container` branches together

The world builds a recipe whose base carries an
`@container (min-width: 320px)` border branch and whose `alert` variant
carries an `@media (min-width: 900px)` padding branch. Narrow (280px)
and wide (400px) shells host the two probes under one shared class.
The spec checks the sheet wraps both branches and the wide probe at a
980px viewport paints all four declarations at once, while the narrow
probe paints only the viewport branch — the container half still gates.

Matrix source: `matrix/recipe/tests/e2e/system-contract.spec.ts`
"responsive recipe applies viewport media and container-query branches
together on one class" + `matrix/recipe/src/styles.ts`
(`recipeMatrixResponsiveCardRuntime`).

> Search terms: recipe conjunction, media container together, responsive card, alert variant, NEO-RECIPE-12

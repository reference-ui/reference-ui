# NEO-REF-01 — reference package shape

Port of the matrix `reference-output` package test: after sync plus the background tasty landing, the world
holds `.reference-ui/types` with its `package.json` legs (`main`/`types`/`exports` for `.`, `./manifest`,
`./runtime`), the bundle plus the declaration template, the `tasty/` artifacts, and a live
`node_modules/@reference-ui/types` junction. The spec live-imports the bundle (the `Reference` export is a
function) and the manifest (default matches the named export) exactly like the oracle.

> Search terms: package shape, TYPES_PACKAGE, generated types package, node_modules link, manifest export, runtime export, NEO-REF-02, NEO-REF-03

## Oracle mapping

Matrix unit test 6 (`creates the generated @reference-ui/types package with runtime and manifest exports`),
expectation-identical. The placeholder rewrite (`./tasty/runtime.js` literal, zero residue) is REF-08 and
already proven by the `reference-types.test.ts` suite — referenced, not duplicated. The world stays small
(one interface plus one alias) so this case never depends on the StyleProps indexing question in D-OPEN-1 (since resolved by the RS scoped-external-ref fix plus the single-root closure change; 26/26 green).

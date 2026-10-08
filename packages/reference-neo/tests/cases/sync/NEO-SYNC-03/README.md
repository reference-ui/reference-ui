# NEO-SYNC-03 — baseSystem.mjs is the singular BaseSystem

The runner syncs this world fresh, then the spec imports `system/baseSystem.mjs`
node-side and checks the frozen contract shape: a `name`, the bundled singular
`fragment` string, the portable `css` stylesheet, and merged `jsxElements[]` —
exactly what the extends validator and reader consume. The world authors one
brand token plus a `css()` want, so the fragment bundle carries the token
source and the css carries the token var. No plural `fragments[]`/`cssChunks[]`
survivors, no duplicated `runtime` (the styled leg owns the runtime data).

Evidence: config `BaseSystem` type, generated-folder-shape §6, coverage-map row 3.

> Search terms: snapshot, serializable, deep-freeze, frozen bundle, portable snapshot, sync/base-system, extends shape, publish boundary, NEO-SYNC-05, NEO-SYNC-12

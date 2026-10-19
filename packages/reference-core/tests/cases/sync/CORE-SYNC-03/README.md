# CORE-SYNC-03 — baseSystem.mjs is the singular BaseSystem

The runner syncs this world fresh, then the spec imports the published `baseSystem`
node-side and checks the frozen contract shape: a `name`, the bundled singular
`fragment` string, the portable `css` stylesheet, and merged `jsxElements[]` —
exactly what the extends validator and reader consume. The world authors one
brand token plus a `css()` want, so the fragment bundle carries the token
source and the css carries the token var. The named `fragments[]` node list rides
beside the singular string (E1: upstream first, own node last); no `cssChunks[]`
survivor and no duplicated `runtime` (the styled leg owns the runtime data).

Evidence: config `BaseSystem` type.

> Search terms: snapshot, serializable, deep-freeze, frozen bundle, portable snapshot, sync/base-system, extends shape, publish boundary, CORE-SYNC-05, CORE-SYNC-12

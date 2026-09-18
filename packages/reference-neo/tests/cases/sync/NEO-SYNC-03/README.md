# NEO-SYNC-03 — baseSystem.mjs is a PortableBaseSystem

The runner syncs this world fresh, then the spec imports `system/baseSystem.mjs`
node-side and checks the frozen contract shape: `schemaVersion 1`, a `name`,
source-tagged `fragments[]`, hashed `cssChunks[]`, the compiled `runtime`, and
`jsxElements[]`. The world authors one brand token plus a `css()` want, so the
fragment bundle carries the token source, the chunk carries the token var, and
the runtime carries the compiled plan. No flattened `fragment`/`css` survivors.

Evidence: contracts `portable-base-system.json`, generated-folder-shape §6, coverage-map row 3.

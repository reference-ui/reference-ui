# NEO-SYNC-12 — @reference-ui/system exports the authoring surface

The runner syncs this world fresh, then the spec imports `system/system.mjs`
node-side: `defineConfig`, `tokens`, `font`, `keyframes`, `globalCss`,
`extendPattern`, `getRhythm`, and `baseSystem` are all present, and
`getRhythm(4)` equals the `calc(4 * var(--spacing-root))` the engine emits for
the world's `4r` padding want. The `font-registry.json` absence is approved:
font data ships via `FontRegistry` types, not a JSON file.

Book vite-alias trap (coverage-map note e, finding F6): the Book maps
`@reference-ui/system` at core source while tsconfig maps it at the generated
folder. Decided: the Book alias moves to generated `system/system.mjs`, so both
resolvers land on the D6 authoring surface and no world gets two `tokens()`
implementations. The alias edit itself is captain-owned (it touches
`reference-lib` config); this slice lands the generated target it must point at.

Evidence: `[decision D6]`, `[core]` core-api §2.1, coverage-map row 2 + note e, generated-folder-shape §7 items 5/10.

> Search terms: token-helpers, rhythm-scale, design-tokens-api, authoring-api, public api, authoring kit, sync/system-surface, sync/authoring-exports, NEO-SYNC-02, NEO-SYNC-05

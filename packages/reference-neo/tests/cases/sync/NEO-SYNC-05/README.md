# NEO-SYNC-05 — consumer specifiers resolve to the generated entries

The runner syncs this world fresh, then the spec resolves the four bare
consumer specifiers node-side from the world: `@reference-ui/react` lands
on `react/react.mjs`, `@reference-ui/react/styles.css` on the D5 copy of
the styled sheet, and `@reference-ui/system` plus
`@reference-ui/system/baseSystem` on the system entries. Resolution runs
through a world-local probe module (`resolve-from-world.mjs`), since
`import.meta.resolve` anchors at the importing module. The spec also pins
the `package.json` exports maps behind each specifier, the three project
`node_modules` links, and that the resolved react entry loads with the
bound `css`/`recipe`. `system.mjs` itself lands with SYNC-12; until then
the system `.` export serves `baseSystem.mjs`.

Evidence: `[decision D5]`, generated-folder-shape §3, coverage-map rows 17/18/19/21 + note e.

> Search terms: subpath, self-reference, probe-module, bound-runtime, consumer handles, public names, sync/consumer-specifiers, sync/exports-map, NEO-SYNC-02, NEO-SYNC-12, NEO-SYNC-13

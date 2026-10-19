# CORE-SYNC-05 — consumer specifiers resolve to the generated entries

The runner syncs this world fresh, then the spec resolves the four bare
consumer specifiers node-side from the world: `@reference-ui/react` lands
on the react entry, `@reference-ui/react/styles.css` on the copy of
the styled sheet, and `@reference-ui/system` plus
`@reference-ui/system/baseSystem` on the system entries. Resolution runs
through a world-local probe module, since
`import.meta.resolve` anchors at the importing module. The spec also pins
the manifest exports maps behind each specifier, the three project
`node_modules` links, and that the resolved react entry loads with the
bound `css`/`recipe`. The system entry itself lands with SYNC-12; until then
the system `.` export serves `baseSystem`.


> Search terms: subpath, self-reference, probe-module, bound-runtime, consumer handles, public names, sync/consumer-specifiers, sync/exports-map, CORE-SYNC-02, CORE-SYNC-12, CORE-SYNC-13

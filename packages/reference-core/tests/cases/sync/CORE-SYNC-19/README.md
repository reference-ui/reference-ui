# CORE-SYNC-19 — getRhythm from @reference-ui/system resolves during sync in a theme file and a component

The runner syncs this world fresh. The theme file imports `getRhythm` and `globalCss` from `@reference-ui/system`
and sets `--gap` to `getRhythm(2)`. The component module imports `getRhythm` from the same id and derives
`gapStyle` from `getRhythm(3)`. Sync evaluates both through the bootstrap import map, where `@reference-ui/system`
resolves to the sync-time system barrel (`src/collect/lib/system-alias.ts`), which exports `getRhythm` as the
generated entry does. The spec reads the generated stylesheet node-side and asserts the theme's `--gap` calc.

> Search terms: getRhythm, rhythm, sync, theme, component, include, bootstrap, import map, system, CORE-SYNC-12, CORE-SYNC-13

# NEO-SYNC-13 — styled is data-only: css()/recipe() come from react bound to the owner

The runner syncs this world fresh, then the spec checks node-side that
`styled/` carries no executable module besides `runtime-data.mjs`
(`styled/css.mjs` is gone) while the generated `react` entry exports
`css` and `recipe` pre-registered over this system's compiled plans: a
`css()` call resolves its plan class and a `recipe()` call returns a class
carrying the `${system}__` owner prefix. The world authors one `css()` want
plus a `chip` recipe as extraction sources; the proof imports the bound
runtime from `react`, never from `styled`.

Evidence: `[decision D4]`, generated-folder-shape §7 items 3/6/10, coverage-map row 13 + note e.

# CORE-SYNC-13 — styled is data-only: css()/recipe() come from react bound to the owner

The runner syncs this world fresh, then the spec checks node-side that
`styled/` carries no executable module besides the runtime-data bundle
(the styled CSS entry is gone) while the generated `react` entry exports
`css` and `recipe` pre-registered over this system's compiled plans: a
`css()` call resolves its plan class and a `recipe()` call returns a class
carrying the `${system}__` owner prefix. The world authors one `css()` want
plus a `chip` recipe as extraction sources; the proof imports the bound
runtime from `react`, never from `styled`.


> Search terms: payload-module, owner-prefix, headless-styled, bound-runtime, hollow styled, runtime relocation, sync/styled-data, sync/react-runtime, CORE-SYNC-02, CORE-SYNC-05

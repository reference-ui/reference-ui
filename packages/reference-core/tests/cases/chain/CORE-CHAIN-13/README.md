# CORE-CHAIN-13 — a local light-only override drops the upstream's dark value

The base stand-in publishes one token, `icon`, as a mode leaf: `light #111111` and `dark #eeeeee`. The app's own
`tokens` file writes `icon` with `light #222222` only. A token leaf replaces the earlier leaf whole (E14), so the
local leaf drops the upstream's dark value rather than merging into it key by key.

The spec wires the base into the app's `ui.config`, runs a real `sync()`, and checks three things:

1. The evaluated spec resolves `colors.icon` to exactly `{ light: '#222222' }`, with no dark key.
2. The published sheet carries no `#eeeeee`, so the dark value never reaches the output.
3. The app's probe paints the local light value, `rgb(34, 34, 34)`, in the served page.

The canonical config is restored with a heal sync in a `finally`.

The check is `mergeTokenTree` in the fragment merge: a node with a `value`, `light`, or `dark` key is a
leaf and replaces the earlier node whole. The merge is the one token merge (E14): the fragments, the font
weights, and the E13 shadow check all go through it.

Evidence: the fragment merge (`mergeTokenTree`), the collector evaluator (`mergeCollectedSpec`).
Siblings: CORE-CHAIN-12 (the shadow warning for the same kind of replacement), CORE-SYNC-10 (a local override of an
upstream value through a stand-in upstream), CORE-CHAIN-04 (later wins between direct entries).

> Search terms: leaf replacement, light, dark, mode leaf, token merge, whole leaf, extends, override, mode, single merge, E14, CORE-CHAIN-12, CORE-SYNC-10

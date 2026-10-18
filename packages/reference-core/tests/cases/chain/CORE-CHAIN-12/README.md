# CORE-CHAIN-12 — a local token that replaces an upstream value warns once per path, naming both values

The app extends two stand-ins. `base` publishes three tokens: `brand`, `quiet`, and `accent`. `mid` extends
`base` and overrides `accent`, so the app's linearized list is `[base, mid]` with `base` once. The app's own
`tokens` file writes two leaves: `brand`, a different value from the base's, and `quiet`, the base's value
unchanged.

The spec wires the stand-ins into the app's `ui.config.ts`, runs a real `sync()`, and reads the warnings from
the sync result. It checks three legs (E13):

1. The local `brand` replaces the base's `#aa0000` with `#bb0000`, so sync emits one `BSS-W-TOKEN-SHADOW`
   warning for `colors.brand`, and the message names the path, the upstream system `core-chain12-base`, and
   both values.
2. The local `quiet` equals the base's value, so it stays silent.
3. `mid` replaces the base's `accent`. An upstream value replaced by a later upstream is normal later-wins,
   so it stays silent. The evaluated `accent` resolves to `mid`'s value.

Exactly one shadow warning comes back for the whole sync. The canonical config is restored with a heal sync
in a `finally`.

The check is `src/collect/lib/shadow.ts` (`mergeTokenFragmentsWithShadows`, `tokenShadowDiagnostic`): a local
leaf over an upstream leaf with a different value, once per path. The warning reaches the sync result through
`evaluateAndCompile` in `src/sync/index.ts`, so it counts in the sync summary like the other warnings.

Evidence: `src/collect/lib/shadow.ts`, `src/collect/lib/merge.ts` (`mergeTokenTree`), `src/diagnostics/report.ts`.
Siblings: CORE-CHAIN-13 (the leaf replacement that drops a dark value), CORE-CHAIN-04 (later wins between direct
entries), CORE-SYNC-10 (a local override of an upstream token, through a stand-in upstream).

> Search terms: shadow, override warning, local token, upstream value, both values, once per path, equal value, later wins, extends, diagnostics, BSS-W-TOKEN-SHADOW, E13, CORE-CHAIN-13, CORE-SYNC-10

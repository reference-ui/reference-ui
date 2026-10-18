# CORE-LAYERS-06 — a changed layered or extended upstream lands on re-sync in the same process, by relative import and by bare specifier

The upstream is a real published base system with one ink token and one utility that paints a probe. The consumer wires it four ways: `layers` or `extends`, each through a relative import or a bare package specifier. The spec runs the four legs in one process, the way the runner does. Each leg syncs the upstream, wires the consumer, changes the upstream's ink from `#be185d` to `#0f766e` in its theme, re-syncs the upstream and then the consumer, and asserts the new value in the served sheet and in the probe's computed colour. Every leg restores the consumer config, removes its link and restores the upstream theme in a `finally`, so the tree is canonical whatever a leg does.

Expected verdict: all four legs land. The two bare legs were red before the fix in `src/config/bundle.ts`: the consumer's re-sync kept the old ink, though the upstream had already published the new one. That was a real bug in Core's config load, not a test artefact. The case was never weakened to hide it; it is green now because the bundler reads the upstream's current file on every load.

What each leg proves, in order:

1. The first sync carries `--colors-up-ink: #be185d`, and the probe paints `rgb(190, 24, 93)`.
2. The upstream publishes `#0f766e` on disk (checked before the consumer re-sync, so a stale consumer is never blamed on the upstream).
3. The consumer re-sync carries `--colors-up-ink: #0f766e`, and the probe paints `rgb(15, 118, 110)` after a reload.

Evidence for the bare-leg bug, observed before the fix (not inferred):

- Same process: after the upstream publishes `#0f766e`, a consumer re-sync that imports `core-layers6-up/baseSystem` still serves `#be185d`, in both buckets.
- Fresh process: the same bare config, with `#0f766e` already published, serves `#0f766e`.
- Relative import, same process: the consumer re-sync serves `#0f766e` in both buckets.

Mechanism, from the code:

- Before the fix, `src/config/bundle.ts` bundled with `packages: 'external'`, so a bare specifier stayed an `import` in the bundle. `src/config/evaluate.ts:92` cache-busts only the bundle entry (`config.bundle.mjs?t=<now>`), so the bare dependency kept its own URL and Node's ESM module map returned the instance the first sync in that process had loaded. A relative import was inlined and read from disk on every load, which is why those legs were always fresh.
- The fix is in `src/config/bundle.ts`: each bare specifier is resolved by a nested probe, and a file named `baseSystem.mjs` or `baseSystem.js` (the published shape: a plain data export) is inlined, so every load reads its current contents. Every other package stays an external import, and caller-supplied `external` entries still win. `packages: 'external'` is gone because it answers a resolve with the bare specifier alone, which hides the file the probe needs.
- `src/config/load.ts` runs bundle and evaluate on every sync, so each re-sync in one process now sees the current upstream. Inlined files are the config's watch dependencies at their real paths, so a re-sync of the upstream also resyncs a watch (CORE-WATCH-28); `src/config/reload.test.ts` pins both the fresh read and that dependency.

Impact: the real lib config imports its icons base system by bare specifier (`packages/reference-lib/ui.config.ts:9`). By the mechanism the bare legs observe, an in-process re-sync there inherited a stale icons base system before the fix; the lib itself was not run against this case. Such a re-sync now reads the current file. A bare upstream change also triggers a watch re-sync: the inlined base system's real path is a watch dependency, even inside `node_modules` (CORE-WATCH-28). A relative upstream file was already a watch input (a metafile input outside `node_modules`).

The bare legs need a package specifier that resolves, so the spec links the upstream into the consumer's `node_modules` at run time. The upstream's `package.json` exports `./baseSystem` the way `@reference-ui/icons` does (`packages/reference-icons/package.json`). The link is gitignored and removed in each leg's `finally`.

> Search terms: re-sync, resync, same process, module cache, ESM cache, bare specifier, package specifier, relative import, layers, extends, live upstream change, stale upstream, node_modules link, config load, evaluateConfig, bundleConfig, base system inlining, watch scope, CORE-LAYERS-04, CORE-CHAIN-06, CORE-CHAIN-07, CORE-WATCH-01

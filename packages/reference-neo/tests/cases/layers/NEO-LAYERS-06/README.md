# NEO-LAYERS-06 — a changed layered or extended upstream lands on re-sync in the same process, by relative import and by bare specifier

The upstream is a real published base system with one ink token and one utility that paints a probe. The consumer wires it four ways: `layers` or `extends`, each through a relative import or a bare package specifier. The spec runs the four legs in one process, the way the runner does. Each leg syncs the upstream, wires the consumer, changes the upstream's ink from `#be185d` to `#0f766e` in its theme, re-syncs the upstream and then the consumer, and asserts the new value in the served sheet and in the probe's computed colour. Every leg restores the consumer config, removes its link and restores the upstream theme in a `finally`, so the tree is canonical whatever a leg does.

Expected verdict: the two relative legs land. The two bare legs are red: the consumer's re-sync keeps the old ink, though the upstream has already published the new one. That is a real bug in Neo's config load, not a test artefact. It stays red until the bug is fixed; this case is not weakened to hide it.

What each leg proves, in order:

1. The first sync carries `--colors-up-ink: #be185d`, and the probe paints `rgb(190, 24, 93)`.
2. The upstream publishes `#0f766e` on disk (checked before the consumer re-sync, so a stale consumer is never blamed on the upstream).
3. The consumer re-sync carries `--colors-up-ink: #0f766e`, and the probe paints `rgb(15, 118, 110)` after a reload.

Evidence for the bare-leg bug (observed, not inferred):

- Same process: after the upstream publishes `#0f766e`, a consumer re-sync that imports `neo-layers6-up/baseSystem` still serves `#be185d`, in both buckets.
- Fresh process: the same bare config, with `#0f766e` already published, serves `#0f766e`.
- Relative import, same process: the consumer re-sync serves `#0f766e` in both buckets.

Mechanism, from the code:

- `src/config/bundle.ts:62-71` bundles with esbuild and `packages: 'external'`, so a bare specifier stays an `import` in the bundle. A relative import is inlined and read from disk on every load, which is why those legs are fresh.
- `src/config/evaluate.ts:30` cache-busts only the bundle entry (`config.bundle.mjs?t=<now>`). The bare dependency keeps its own URL, so Node's ESM module map returns the instance loaded on the first sync in that process.
- `src/config/load.ts:50-52` runs bundle and evaluate on every sync, so every re-sync in one process reuses that first instance.

Impact to check, not yet verified: the real lib config imports its icons base system by bare specifier (`packages/reference-lib/ui.config.ts:9`), and the watcher re-syncs in-process (`NEO-WATCH-01` drives `watchSync` in the spec process). A watch re-sync after an icons re-publish would then inherit the same stale value. This is an inference from the loader path, not a watch run.

The bare legs need a package specifier that resolves, so the spec links the upstream into the consumer's `node_modules` at run time. The upstream's `package.json` exports `./baseSystem` the way `@reference-ui/icons` does (`packages/reference-icons/package.json`). The link is gitignored and removed in each leg's `finally`.

> Search terms: re-sync, resync, same process, module cache, ESM cache, bare specifier, package specifier, relative import, layers, extends, live upstream change, stale upstream, node_modules link, config load, evaluateConfig, bundleConfig, NEO-LAYERS-04, NEO-CHAIN-06, NEO-CHAIN-07, NEO-WATCH-01

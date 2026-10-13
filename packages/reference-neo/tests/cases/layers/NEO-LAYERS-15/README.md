# NEO-LAYERS-15 — a re-synced layered upstream drops its removed rule from the consumer's sheet, and watch mode re-syncs the consumer after a relative-path upstream rebuild

The consumer lists one real upstream under `layers`, imported by a relative path
(`../upstreams/lc/.reference-ui/system/baseSystem.mjs`). Because the import is relative, the
published file is a watch input. The upstream ships one ink token pair (`lcInk`, `lcPaper`)
and two utilities: `lcInkClass` (a colour) and `lcPaperClass` (a background). Both are synced
for real, and the consumer config is rewritten by the spec and restored in a `finally`.

The spec runs two legs in one process, in order.

1. Removal, with an explicit re-sync. The spec deletes the paper utility from the upstream
   source, runs `sync()` on the upstream, then `sync()` on the consumer. It asserts that:
   - the upstream publishes no `neo-layers15-lc__bg-c_lcPaper` rule any more;
   - the consumer sheet drops that class and its rule, so no stale CSS survives the re-sync;
   - the paper probe's computed background becomes transparent after a reload;
   - the ink utility and `--colors-lc-ink: #be185d` stay in the sheet and still paint `rgb(190, 24, 93)`.
2. Watch, with a live rebuild. The spec starts `watchSync()` on the consumer, then edits the
   ink token to `#0f766e` and runs `sync()` on the upstream alone. The spec never syncs the
   consumer in this leg, so a resync can only come from the watcher. It asserts that:
   - `onResync` fires after the upstream rebuild;
   - the consumer sheet carries `--colors-lc-ink: #0f766e`, drops the old ink, and still lacks the removed paper rule;
   - the ink probe paints `rgb(15, 118, 110)` after a reload.

The class names are the engine's names for these utilities. The spec asserts each one in the
published utilities, so a renamed class fails loud.

Not covered: a bare-specifier upstream. The bundler inlines a published base system imported
by bare specifier and keeps it out of the watch scope (`src/config/bundle.ts`), so a bare
upstream rebuild does not trigger a watch resync. That is a known gap, not asserted here.
NEO-LAYERS-06 covers the bare-specifier re-sync in one process.

> Search terms: re-sync, lifecycle, stale CSS, removed rule, watch mode, watchSync, onResync, relative import, upstream rebuild, layers, live upstream change, NEO-WATCH-01, NEO-SYNC-14, NEO-LAYERS-06

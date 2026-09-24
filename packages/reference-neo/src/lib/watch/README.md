# watch

The file watcher behind `neo sync --watch`, in one place. Watching is
not free: parcel delivers raw create/update/delete bursts across
multiple roots, include globs name files while subscriptions need
directories, and every matched event must settle into exactly one
serial resync — so the root derivation, the ignore policy, and the
debounce-plus-serialization scheduler all live here, behind one
function, instead of scattered as ad-hoc watcher calls.

Moved whole from `src/sync/` (WAVE4-WATCH-LIB): legacy kept watch
top-level because it held its own piscina worker plus its own event
bus, and neither force exists in Neo — parcel subscribe direct, no bus
by HQ law — so lib/ stands. The picomatch type seam rides along
because only the watcher matches globs.

## What it owns

- one baseline sync, then resync on every matched add/change/unlink
  until stop (`watchSync`; `onResync` fires only for watch-driven
  resyncs, never the baseline)
- include-glob matching over relative paths plus exact matching of
  config-dependency files, wherever they live
- watch-root derivation from the static heads of the include globs
  (`deriveWatchRoots`; collapsed shortest-first, dependency dirs
  folded in, no-static-head means the project root)
- the ignore policy: node_modules, the generated folder, git
  internals, and positive patterns from ancestor `.gitignore` files —
  comments, blanks, and negations never ignore
- trailing-edge debounce into one serial sync, so a burst of saves
  costs one rebuild and a burst behind a slow sync costs one extra
  pass, never a backlog
- watcher-error policy: dropped OS event buffers stay quiet, other
  errors report through `onError` and resync after a cooldown so a
  flapping backend cannot self-perpetuate

## What it does not own

- what a sync builds (that is the sync pipeline's; watch only calls it)
- the CLI process half: boot lines, prints, signal shutdown, the
  never-promise that holds the process open
- the include globs themselves (they come from the user config)

## Consumers

- the CLI watch runner, via `watchSync`
- the NEO-SYNC-14 resync case and the NEO-WATCH-01 live-edit→paint
  loop case, via `watchSync`

Every parcel subscription in Neo routes through here; nothing outside
this module touches the watcher backend or the matcher. The module
stays whole until a second consumer of its internals appears — that,
a worker pool, or an event bus is the trigger to split it out.

# watch

The file watcher behind `ref sync --watch`, in one place. Watching is
not free: parcel delivers raw create/update/delete bursts across
multiple roots, include globs name files while subscriptions need
directories, the baseline sync races the first subscription, and every
matched event must settle into exactly one serial resync — so the root
derivation, the ignore policy, the boot order, the debounce-plus-
serialization scheduler, and the handshake a one-shot poke waits on all
live here, behind one function, instead of scattered as ad-hoc watcher
calls.

Moved whole from `src/sync/`: legacy kept watch
top-level because it held its own piscina worker plus its own event
bus, and neither force exists in Neo — parcel subscribe direct, no bus — so lib/ stands. The picomatch type seam rides along
because only the watcher matches globs.

## What it owns

- the boot order: subscribe first, then the baseline sync. An edit that
  lands while the baseline runs is buffered and resynced once it lands,
  so no edit can fall between the baseline's reads and the subscription.
  A root that a sync newly subscribes gets one catch-up sync for the
  same reason (`watchSync` in `index.ts`)
- one baseline sync, then resync on every matched add/change/unlink
  until stop (`onResync` fires only for watch-driven resyncs, never the
  baseline)
- the ignore policy: the engine's own native ignore directories
  (`NATIVE_IGNORE_DIRS`: node_modules, .git, dist, build, the generated
  folder, and the rest) at any depth. The watcher never reads a
  `.gitignore`: a gitignored file that matches include is watched and
  synced, exactly as the engine compiles it
- include matching as the engine's walk reads it: dot entries match
  (`dot: true`), a negated pattern subtracts, and nothing under an
  ignored directory matches (`match.ts`)
- symlinked roots and targets: the project root is canonicalized before
  any comparison, since parcel reports real paths; a matched symlink is
  watched through its real target, whose directory becomes a root, and
  an edit there reports under the link's own relative path (`classify.ts`);
  a symlinked directory under include maps back to its link even when it is
  empty at boot, so a new file in its target resyncs (`match.ts`)
- watch roots from the static heads of the include globs, plus the
  config dependency dirs and symlink target dirs, collapsed
  shortest-first; a glob with no static head means the project root
- trailing-edge debounce into one serial sync (`scheduler.ts`), with a
  max-wait ceiling counted from a burst's first event, so a steady
  stream of saves still resyncs; a burst behind a slow sync costs one
  extra pass, never a backlog
- the trigger scope follows each sync: a successful sync narrows it to
  the latest loaded config, and a failed sync widens it to the union of
  the live scope and that config (`scope.ts`), so the save that fixes
  the failure is still seen
- watcher-error policy (`handler.ts`): a dropped-OS-event-buffer error
  schedules a debounced resync and reports nothing, since the re-scan
  recovers the lost batch; any other error reports through `onError` and
  resyncs after a cooldown so a flapping backend cannot self-perpetuate
- the watch side of the covered handshake (`handshake.ts`), below

## The covered handshake (watch side)

A one-shot `ref sync` that meets a resident watch pokes it with SIGUSR2
and waits on `<lockDir>/watch-state.json`. The watch keeps that file:

- at boot, once the SIGUSR2 listener is attached, with nothing requested
  and nothing done
- on each poke: `requested` moves and is published before the resync is
  scheduled, so a reader that sees the new count knows the poke was taken
- when a resync pass starts it reads `requested`; when the pass ends it
  publishes `done` (the count it started from) and `failed` (whether that
  pass failed)
- on stop: `stopping` is published before anything settles
- after a lock re-assert: the re-assert recreates the owner, not the
  state file, so the counters are published again

Every write is synchronous, so two publishes cannot land out of order,
and a publish runs only while the lock dir still names this watch's
owner. A write that fails because the generated folder is gone reports
nothing; the re-assert publishes again.

## What it does not own

- what a sync builds (that is the sync pipeline's; watch only calls it)
- the CLI process half: boot lines, prints, signal shutdown, the
  never-promise that holds the process open
- the include globs themselves (they come from the user config)
- the one-shot side of the handshake (the one-shot reads the file; the
  lock and the preempt matrix live in `src/sync/session.ts`)

## Consumers

- the CLI watch runner, via `watchSync`
- the NEO-SYNC-14 resync case and the NEO-WATCH-01 live-edit→paint
  loop case, via `watchSync`
- the NEO-WATCH-13 case (the failed-scope path, via `watchSync`) and the
  NEO-WATCH-14 and -15 cases (the dropped-batch and boot-window paths,
  via the spawned `ref sync --watch`)

Every parcel subscription in Neo routes through here; nothing outside
this module touches the watcher backend or the matcher. The module
stays whole until a second consumer of its internals appears — that,
a worker pool, or an event bus is the trigger to split it out.

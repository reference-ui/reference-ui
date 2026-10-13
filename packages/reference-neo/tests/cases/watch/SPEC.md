# WATCH — sync, watch and staged-publish lifecycle

Purpose: the numbered lifecycle contract for `ref sync` and `ref sync --watch`.
It covers how the generated folder is published, who holds it, what a watch
sees and when it resyncs, how the types build keeps up, and how the processes
stop. Browser paint after a watched edit (NEO-WATCH-01) is one leg of it, not
the whole group.

Format: each claim is `LC-nn` (lifecycle claim), grouped A to E. Status words
follow SYNC: `open`, `in-progress`, `done`, `blocked-on-rs`, `approved-absence`,
`retired`. Proof is a case id, or `file "test name"` for a unit or repro test,
or `open`. Paths are under `packages/reference-neo/src/` unless a row says
otherwise. Code anchors are `file:function`, with no line numbers. The case
ledger is `TESTS.md`. Counts at writing: 45 claims, 34 done, 5 in-progress,
6 open, 0 approved-absence (the absences are listed at the end).

## A. Staged publish and commit

| id | claim | status | proof | code |
| --- | --- | --- | --- | --- |
| LC-01 | a changed file flips live by rename, with no remove-first window | done | `sync/commit-live-reader.test.ts` "60 rounds of changed bytes leave every polled read present" | `sync/commit.ts:commitOneFile` |
| LC-02 | identical bytes keep their mtime, so a no-change resync emits no bundler event | done | `sync/commit-repro.test.ts` "an identical resync leaves mtimes alone: bundlers see zero events" | `sync/commit.ts:commitOneFile` |
| LC-03 | a reader never finds a live file missing during a resync | done | `sync/commit-repro.test.ts` "a resync never strands a reader: every sample sees every runtime file" | `sync/commit.ts:commitStagedDir` |
| LC-04 | a reader never sees a torn (partly written) live file | open | none: the live-reader test counts misses and errors, never content; whole-file swaps follow from rename but are not asserted | `sync/commit.ts:commitOneFile` |
| LC-05 | a failed re-sync keeps the last-good folder byte-identical and drops its stage | done | NEO-SYNC-11 (sheet byte-identical; `sync.stage` gone) | `sync/index.ts:sync` (catch, `dropFailedStageAndScratch`) |
| LC-06 | a failed sync on a fresh world rejects with file and line and leaves no folder | done | NEO-SYNC-11; `sync/sync-diagnostics.test.ts` "rejects with file and line on error diagnostics and leaves no folder" | `sync/index.ts:sync` (finally, `removeDirIfEmpty`) |
| LC-07 | a failing `ref sync` exits 1 | done | NEO-LAYERS-05 (spawned bin, config-failure leg); the compile-error leg takes the same path and is not asserted | `cli/sync.ts:runSyncCommand` |
| LC-08 | a killed one-shot does not block the next sync, which restores the folder | done | NEO-CLI-01 (SIGTERM mid-publish, then the next sync restores) | `sync/index.ts:sync` (stage dropped under the lock) |
| LC-09 | a live writer's temp beside a preserved root survives a commit; a dead writer's temp and an old pid-less temp are swept | done | `sync/commit-preserve.test.ts` "keeps the live and fresh temps, sweeps the dead and old legacy temps, and drops stale files" | `sync/commit.ts:sweepStrandedWriterTemps`, `isStrandedWriterTemp` |
| LC-10 | the lock dir and the tasty dir are never committed over or deleted by a sync | done | `sync/commit-preserve.test.ts` (tasty dir untouched); `sync/session-repro.test.ts` "%s mid-resync: the lock outlives the sync" (lock) | `sync/index.ts:assembleAndCommit`, `sync/commit.ts:commitStagedDir` |
| LC-11 | `ref clean` wipes the folder but keeps the lock dir, then drops the emptied root | done | `sync/clean.test.ts` "keeps a live lock byte-identical while wiping everything else"; "drops an empty dir and tolerates a missing one" | `sync/clean.ts:cleanDir`, `removeDirIfEmpty`; `cli/clean.ts:runCleanCommand` |

## B. Session lock

The lock is the `sync.lock` dir under `.reference-ui`. A one-shot pokes a live
watch rather than killing it (`sync/session.ts`, `UNIFORM_KILL = false`, the
decision on record). Within `ref`, only `ref clean` kills a live watch.
`--break-lock` takes the lock without killing its holder.

| id | claim | status | proof | code |
| --- | --- | --- | --- | --- |
| LC-12 | one owner per project: claimed by atomic mkdir, released only by its owner nonce; the same process re-enters without preempting itself | done | `sync/session.test.ts` "holds the lock dir while held and removes it on release"; "re-enters for the same process without preempting itself"; "leaves a stolen lock alone on release" | `sync/session.ts:acquireSyncSession`, `tryClaimDir`, `releaseSession` |
| LC-13 | one-shot preempts one-shot: the victim takes SIGTERM with a preempt marker, frees the lock and exits 75 naming the newcomer; the newcomer completes | done | `sync/session-repro.test.ts` "one-shot toward one-shot kills: victim exits 75, newcomer completes"; `sync/session.test.ts` "a watch with a graceful shutdown still exits 75 on a SIGTERM carrying a preempt marker" | `sync/session.ts:killHolder`, `exitIfSuperseded` |
| LC-14 | one-shot toward a live watch pokes it (SIGUSR2): the watch resyncs, and the newcomer exits 0 with the covered line | done | `sync/session-repro.test.ts` "one-shot toward watch pokes: newcomer exits 0 covered, watch rebuilds and lives" | `sync/session.ts:pokeWatchHolder`, `preemptLiveHolder`; `lib/watch/index.ts:watchSync` |
| LC-15 | watch toward watch never preempts: the newcomer attaches, blocks on the owner pid, and exits 0 when the owner stops | done | `sync/session-repro.test.ts` "watch toward watch attaches: the newcomer stays alive on the running session and exits when the owner stops"; `sync/session.test.ts` "arms its forwarders before it announces, and removes them when the owner exits" | `sync/session.ts:attachToWatchSession`; `cli/watch.ts:runWatch` |
| LC-16 | an attached client forwards SIGINT, SIGTERM and SIGHUP to the owner, which stops cleanly, and the client exits 0 after it | done | `sync/session-repro.test.ts` "attached watch forwards %s: a signal to the newcomer stops the owner cleanly" (three signals) | `sync/session.ts:attachToWatchSession` |
| LC-17 | `ref clean` kills any live holder, watch included; the killed watch exits 75 and the next sync runs unlocked | done | `sync/clean-repro.test.ts` "clean toward watch kills: watch exits 75, the next sync proceeds unlocked"; "clean toward one-shot kills: victim exits 75, clean removes the folder" | `sync/session.ts:preemptLiveHolder`; `cli/clean.ts:runCleanCommand` |
| LC-18 | a stale lock (dead pid) or a garbage owner is taken over with a warning naming it | done | `sync/session-repro.test.ts` "stale lock takes over with a warning and completes"; "malformed lock takes over with a warning and completes" | `sync/session.ts:contendForLock`, `acquireContendedLock` |
| LC-19 | `--break-lock` takes a live lock with a warning, and the holder keeps running | done | `sync/session-repro.test.ts` "--break-lock takes a live lock with a warning and the holder survives" | `sync/session.ts:acquireContendedLock`, `warnBreakLock` |
| LC-20 | a watch keeps its lock until its in-flight sync settles, then commits and releases it | done | `sync/session-repro.test.ts` "%s mid-resync: the lock outlives the sync, a newcomer is covered, the sync commits, exit 0"; `sync/session.test.ts` "a watch with a graceful shutdown keeps its lock on %s until release" | `lib/watch/index.ts:watchSync` (stop settles before release); `sync/session.ts:makeStopHandler` |
| LC-21 | a watch re-asserts its lock when `.reference-ui` is deleted under it | in-progress | NEO-WATCH-07 (planned, no folder yet) | none yet: no `src` path re-creates `sync.lock` |

## C. Watch scope, debounce and resync

| id | claim | status | proof | code |
| --- | --- | --- | --- | --- |
| LC-22 | trailing debounce of 60 ms with a 500 ms max-wait: a steady stream of saves still resyncs | done | `lib/watch/scheduler.test.ts` "fires one resync after the settle quiet time"; "caps a reset at the first schedule plus max-wait"; "still resyncs through a 3 s burst that never goes quiet, bounded by max-wait" (pins the exported constants, not the literals) | `lib/watch/scheduler.ts:createResyncScheduler` |
| LC-23 | a burst landing behind an in-flight sync costs exactly one follow-up pass | done | `lib/watch/scheduler.test.ts` "costs exactly one follow-up pass for events that land mid-sync" | `lib/watch/scheduler.ts:request`, `drain` |
| LC-24 | a failing resync reports through onError, and the watch keeps going | done | `lib/watch/scheduler.test.ts` "a rejected pass goes to onError and a later schedule still runs"; "a follow-up requested behind a failing pass still runs" | `lib/watch/scheduler.ts:runPass`; `lib/watch/index.ts:watchSync` |
| LC-25 | add, change and unlink of an included file each resync the sheet (a rename is an unlink plus an add) | done | NEO-SYNC-14 (`specs/watch.spec.ts`: add, rewrite, delete) | `lib/watch/index.ts:toWatchChange`, `createParcelHandler` |
| LC-26 | only files matching the include globs, or a config dependency, wake the watch; a config edit rebuilds the scope, so widening takes effect and narrowing quiets the removed globs | done | NEO-SYNC-14 (`specs/watch-include.spec.ts`: widen, narrow) | `lib/watch/index.ts:refreshTriggerScope`, `deriveWatchRoots` |
| LC-27 | a relative-path upstream file is a watch input: its rebuild resyncs the consumer | done | NEO-LAYERS-15 (watch leg) | `config/bundle.ts` (dependencyPaths) |
| LC-28 | a bare-specifier upstream rebuild triggers a watch resync | open | none: NEO-LAYERS-15 records it as a known gap; NEO-LAYERS-06 covers the one-process case only | `config/bundle.ts` keeps inlined paths out of the watch list |
| LC-29 | a watched edit (css, token value, fragment add and delete) repaints the browser after reload | done | NEO-WATCH-01 (`specs/watch-loop.spec.ts`) | `lib/watch/index.ts:watchSync` (`onResync`) |
| LC-30 | a symlinked project root and symlinked sources: the watch matches the files the engine compiles | in-progress | NEO-WATCH-02 (root) and NEO-WATCH-04 (target edit), both planned | `lib/watch/index.ts:toWatchChange` (note 3) |
| LC-31 | dotfiles and gitignored files that match include: the watch matches the files the engine compiles | in-progress | NEO-WATCH-05 (gitignored) and NEO-WATCH-06 (dotfile), both planned | `lib/watch/index.ts:getIgnoreGlobs`, `watchSync` (notes 1, 2) |
| LC-32 | a directory moved into or out of include resyncs with the engine's file set | in-progress | NEO-WATCH-03, planned | `lib/watch/index.ts:deriveWatchRoots`, `toWatchChange` |
| LC-33 | a watcher error other than dropped events reports and resyncs, at most once per 5 s cooldown; dropped-event errors stay quiet | open | none: no test reaches `createWatcherErrorHandler` | `lib/watch/index.ts:createWatcherErrorHandler` |

Notes on group C. These are code facts the open rows depend on, read from the
source. They are not yet verified behaviour.

1. The watcher drops gitignored paths (`getIgnoreGlobs`, per `lib/watch/README.md`).
   The engine reads no `.gitignore` (none in `packages/reference-rs/modules/atomic/src`).
   Its disk scan skips the fixed names in `sources.rs` `IGNORE_DIRS`, which
   include `dist`, `build` and `target` that the watcher does not ignore by name.
   The two disagree until NEO-WATCH-05 decides.
2. The watch matcher is `picomatch(include)` with defaults, so `*` and `**` skip
   dotfiles. The engine's include glob (`modules/atomic/src/includes/glob.rs`)
   has no leading-dot check (grep). The two disagree until NEO-WATCH-06 decides.
3. The engine follows symlinks (`sources.rs:entry_is_dir` falls back to `is_dir()`).
   Whether the parcel subscription sees edits through a link, or to a target
   outside the root, is unverified. NEO-WATCH-04 decides.
4. Debounce is proven at unit level only. The NEO-WATCH-01 and NEO-CLI-02 READMEs
   credit NEO-SYNC-14 with debounce, but its specs have no debounce leg.

## D. Types and tasty phase

| id | claim | status | proof | code |
| --- | --- | --- | --- | --- |
| LC-34 | a warm sync queues a background tasty rebuild even when the manifest already exists | done | `sync/tasty-refresh.test.ts` "queues a background rebuild on a warm sync even when the manifest already exists" (bridge mocked) | `sync/tasty-phase.ts:refreshWarmTastyBuild` |
| LC-35 | a sync landing during a rebuild coalesces into one follow-up that never overlaps the run in flight | done | `sync/tasty-refresh.test.ts` "coalesces a sync that lands mid-rebuild into one follow-up run that never overlaps" | `sync/tasty-phase.ts:drainTastyRefreshLane` |
| LC-36 | a save during a cold build gets one follow-up once it settles; saves during one cold build coalesce | done | `sync/tasty-cold-follow-up.test.ts` "a save that lands while the cold build is pending reaches the manifest through one follow-up"; "saves that land during one cold build coalesce into one follow-up" | `sync/tasty-phase.ts:queueAfterColdBuild`, `runColdFollowUp` |
| LC-37 | a failed build frees its lane, and the next sync builds again | done | `sync/tasty-cold-follow-up.test.ts` "a failed cold build drops its follow-up, and the next sync builds fresh"; `sync/tasty-refresh.test.ts` "recovers after a failed rebuild: the next sync runs a fresh one" | `sync/tasty-phase.ts:drainTastyRefreshLane` |
| LC-38 | a rename refreshes the reference types: the renamed symbol loads and the old spelling rejects | done | NEO-REF-04 | `sync/tasty-phase.ts:scheduleReferenceTastyPhase` |
| LC-39 | a failed types build is reported on the watch resync line | in-progress | NEO-WATCH-08 (in progress: folder in the working tree, not yet committed); the line is already emitted by the runner | `cli/watch.ts:runWatch` (`drainFoldedLanding`) |
| LC-40 | a failed types build makes a one-shot `ref sync` exit 1 | open | none; the code path exists | `cli/sync.ts:runSyncCommand` |

## E. Signals and shutdown

| id | claim | status | proof | code |
| --- | --- | --- | --- | --- |
| LC-41 | SIGINT, SIGTERM and SIGHUP stop a booted watch gracefully: the in-flight sync settles, the lock goes, and the process exits 0 by code | done | `sync/session-repro.test.ts` "%s stops an idle watch by code and releases the lock" (SIGINT, SIGHUP); NEO-CLI-02 (SIGTERM exits 0, not by signal) | `cli/watch.ts:attachShutdown`; `lib/watch/index.ts:watchSync` (stop) |
| LC-42 | a repeated stop signal while stopping is ignored: one stop, and the lock is held to the end | done | `sync/session-repro.test.ts` "a second signal while stopping is ignored: one stop, the lock held to the end, exit 0" | `cli/watch.ts:attachShutdown` |
| LC-43 | a stop signal during the baseline sync, before shutdown is armed, frees the lock and dies by that signal | open | none; the intent is written in `sync/session.ts:makeStopHandler` | `cli/watch.ts:runWatch` arms shutdown only after `watchSync` resolves |
| LC-44 | a one-shot frees its lock at once on SIGINT, SIGTERM or SIGHUP | done | `sync/session.test.ts` "a one-shot frees its lock at once on %s even with a graceful shutdown around" | `sync/session.ts:makeStopHandler` |
| LC-45 | a one-shot re-raises its stop signal and dies by it | open | NEO-CLI-01 proves SIGTERM only; SIGINT and SIGHUP are unproven | `sync/session.ts:makeStopHandler` |

## Out of scope and approved absences

- approved-absence: no `session.json` sentinel. Readiness is the watcher's `onResync` (NEO-WATCH-01 README).
- approved-absence: the matrix contract's webpack leg is not ported; Neo has no webpack target (H5 retire).
- out of scope: Windows. The poke and signal legs are POSIX-only (`it.skipIf(!POSIX)`), so no claim covers win32.
- out of scope, other groups: the normalizeCss reset injection (`sync/reset.ts`, NEO-LAYER-04) and the bench phase marks (`sync/phases.ts`) carry no lifecycle claim.
- NEO-WATCH-09 and up are reserved for the doom round, which is still running. No ids are assigned here.

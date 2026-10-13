# WATCH — sync, watch and staged-publish lifecycle

Purpose: the numbered lifecycle contract for `ref sync` and `ref sync --watch`.
It covers how the generated folder is published, who holds it, what a watch
sees and when it resyncs, how the types build keeps up, and how the processes
stop. Browser paint after a watched edit (NEO-WATCH-01) is one leg of it, not
the whole group.

Format: each claim is `LC-nn` (lifecycle claim), grouped A to F. Status words
follow SYNC: `open`, `in-progress`, `done`, `blocked-on-rs`, `approved-absence`,
`retired`. Proof is a case id, or `file "test name"` for a unit or repro test,
or `open`. Paths are under `packages/reference-neo/src/` unless a row says
otherwise. Code anchors are `file:function`, with no line numbers. The case
ledger is `TESTS.md`. Claims LC-46 and up were added after the first baseline
and sit in the group they belong to, so their numbers are not in table order.
A claim stays `in-progress` while a Known open item breaks its text. Counts:
62 claims, 54 done, 4 in-progress, 4 open, 0
approved-absence (the absences are listed at the end).

## A. Staged publish and commit

| id | claim | status | proof | code |
| --- | --- | --- | --- | --- |
| LC-01 | a changed file flips live by rename, with no remove-first window | done | `sync/commit-live-reader.test.ts` "60 rounds of changed bytes leave every polled read present" | `sync/commit.ts:commitOneFile` |
| LC-02 | identical bytes keep their mtime, so a no-change resync emits no bundler event | done | `sync/commit-repro.test.ts` "an identical resync leaves mtimes alone: bundlers see zero events" | `sync/commit.ts:commitOneFile` |
| LC-03 | a reader never finds a live file missing during a resync | done | `sync/commit-repro.test.ts` "a resync never strands a reader: every sample sees every runtime file" | `sync/commit.ts:commitStagedDir` |
| LC-04 | a reader never sees a torn (partly written) live file | open | none: the live-reader test counts misses and errors, never content; whole-file swaps follow from rename but are not asserted | `sync/commit.ts:commitOneFile` |
| LC-05 | a failed re-sync keeps the last-good folder byte-identical and drops its stage | done | NEO-SYNC-11 (sheet byte-identical; `sync.stage` gone) | `sync/index.ts:sync` (catch, `dropFailedStageAndScratch`) |
| LC-06 | a failed sync on a fresh world rejects with file and line and leaves no folder | done | NEO-SYNC-11; `sync/sync-diagnostics.test.ts` "rejects with file and line on error diagnostics and leaves no folder" | `sync/index.ts:sync` (finally, `removeDirIfEmpty`) |
| LC-07 | a failing `ref sync` exits 1 | in-progress | NEO-LAYERS-05 (spawned bin, config-failure leg); the compile-error leg takes the same path and is not asserted. Known open 4: a never-settling config exits 13 with no `[ref]` line | `cli/sync.ts:runSyncCommand` |
| LC-08 | a killed one-shot does not block the next sync, which restores the folder | done | NEO-CLI-01 (SIGTERM mid-publish, then the next sync restores) | `sync/index.ts:sync` (stage dropped under the lock) |
| LC-09 | a live writer's temp beside a preserved root survives a commit; a dead writer's temp and an old pid-less temp are swept | done | `sync/commit-preserve.test.ts` "keeps the live and fresh temps, sweeps the dead and old legacy temps, and drops stale files" | `sync/commit.ts:sweepStrandedWriterTemps`, `isStrandedWriterTemp` |
| LC-10 | the lock dir and the tasty dir are never committed over or deleted by a sync | done | `sync/commit-preserve.test.ts` (tasty dir untouched); `sync/session-repro.test.ts` "%s mid-resync: the lock outlives the sync, a newcomer waits for the stop and then syncs itself, exit 0" (lock) | `sync/index.ts:assembleAndCommit`, `sync/commit.ts:commitStagedDir` |
| LC-11 | `ref clean` wipes the folder but keeps the lock dir, then drops the emptied root | done | `sync/clean.test.ts` "keeps a live lock byte-identical while wiping everything else"; "drops an empty dir and tolerates a missing one" | `sync/clean.ts:cleanDir`, `removeDirIfEmpty`; `cli/clean.ts:runCleanCommand` |
| LC-46 | a commit that fails partway journals each live file it replaces and puts it back, so the generated folder is byte-identical to its last-good state | done | NEO-WATCH-19 (each replaced file journaled as a hard link, renamed back on failure); `sync/commit-rollback.test.ts` "restores replaced files and a dir moved aside, and removes what the commit added" (skipped as root) | `sync/commit-journal.ts:CommitJournal`, `sync/commit.ts:commitStagedDir` |
| LC-47 | a file where a generated dir belongs moves aside and the dir is made, so the sync heals instead of failing with EEXIST on every run | done | NEO-WATCH-21; `sync/commit-rollback.test.ts` "a file in the way of a generated dir moves aside, the dir is made, and the commit lands whole" | `sync/commit.ts:ensureLiveDirs` |
| LC-48 | `--break-lock` over a sync frozen mid-commit: the displaced sync stops before its next live write and fails cleanly, and the breaker exits 0 with a folder equal to a clean rebuild | done | NEO-WATCH-20; `sync/commit-rollback.test.ts` "stops before its first live change when the lock is already taken"; "leaves what it already wrote in place, since the new holder owns the folder from then on". Known open 6: a displaced sync still in assembly can write the shared stage | `sync/owner-check.ts:lockTakenByOther`, `sync/commit.ts:commitStagedDir` |

## B. Session lock

The lock is the `sync.lock` dir under `.reference-ui`. A one-shot pokes a live
watch rather than killing it (`sync/session.ts`, `UNIFORM_KILL = false`, the
decision on record), and kills a live one-shot holder with SIGTERM and a preempt
marker (LC-13). Within `ref`, only `ref clean` kills a live watch. `--break-lock`
takes the lock without killing its holder. Stop handlers are armed before the
owner document is visible (LC-50); only a watch answers all three stop signals,
and a one-shot answers SIGTERM alone (LC-54).

| id | claim | status | proof | code |
| --- | --- | --- | --- | --- |
| LC-12 | one owner per project: claimed by atomic mkdir, released only by its owner nonce; the same process re-enters without preempting itself | done | `sync/session.test.ts` "holds the lock dir while held and removes it on release"; "re-enters for the same process without preempting itself"; "leaves a stolen lock alone on release" | `sync/session.ts:acquireSyncSession`, `sync/session-claim.ts:claimFreshLock`, `sync/session-hold.ts:releaseHold` |
| LC-13 | one-shot preempts one-shot: the victim takes SIGTERM with a preempt marker, frees the lock and exits 75 naming the newcomer; the newcomer completes | done | `sync/session-repro.test.ts` "one-shot toward one-shot kills: victim exits 75, newcomer completes"; `sync/session-hold.test.ts` "a watch with a graceful shutdown still exits 75 on a SIGTERM carrying a preempt marker" | `sync/session.ts:killHolder`, `sync/session-hold.ts:exitIfSuperseded` |
| LC-14 | one-shot toward a live watch pokes it (SIGUSR2): the watch resyncs, and the newcomer exits 0 with the covered line | done | `sync/session-repro.test.ts` "one-shot toward watch pokes: newcomer exits 0 covered, watch rebuilds and lives" | `sync/session-covered.ts:pokeWatch`, `sync/session-covered.ts:awaitWatchCoverage`, `lib/watch/index.ts:watchSync` |
| LC-15 | watch toward watch never preempts: the newcomer attaches, blocks on the owner pid, and exits 0 when the owner stops | done | `sync/session-repro.test.ts` "watch toward watch attaches: the newcomer stays alive on the running session and exits when the owner stops"; `sync/session.test.ts` "arms its forwarders before it announces, and removes them when the owner exits" | `sync/session-attach.ts:attachToWatchSession`; `cli/watch.ts:runWatch` |
| LC-16 | an attached client forwards SIGINT, SIGTERM and SIGHUP to the owner, which stops cleanly, and the client exits 0 after it | done | `sync/session-repro.test.ts` "attached watch forwards %s: a signal to the newcomer stops the owner cleanly" (three signals) | `sync/session-attach.ts:attachToWatchSession` |
| LC-17 | `ref clean` kills any live holder, watch included; the killed watch exits 75 and the next sync runs unlocked | done | `sync/clean-repro.test.ts` "clean toward watch kills: watch exits 75, the next sync proceeds unlocked"; "clean toward one-shot kills: victim exits 75, clean removes the folder" | `sync/session.ts:preemptLiveHolder`; `cli/clean.ts:runCleanCommand` |
| LC-18 | a stale lock (dead pid) or a garbage owner is taken over with a warning naming it | done | `sync/session-repro.test.ts` "stale lock takes over with a warning and completes"; "malformed lock takes over with a warning and completes" | `sync/session.ts:contendForLock`, `takeContendedLock` |
| LC-19 | `--break-lock` takes a live lock with a warning, and the holder keeps running | done | `sync/session-repro.test.ts` "--break-lock takes a live lock with a warning and the holder survives" | `sync/session.ts:takeContendedLock`, `warnBreakLock` |
| LC-20 | a watch keeps its lock until its in-flight sync settles, then commits and releases it | done | `sync/session-hold.test.ts` "a watch with a graceful shutdown keeps its lock on %s until release"; `sync/session-repro.test.ts` "%s mid-resync: the lock outlives the sync, a newcomer waits for the stop and then syncs itself, exit 0" | `lib/watch/index.ts:createWatchRun` (`teardown`: stop settles before release); `sync/session-hold.ts:makeStopHandler` |
| LC-21 | a watch re-asserts its lock when `.reference-ui` is deleted under it | done | NEO-WATCH-07; `lib/watch/lock.test.ts` "restores the held owner, with the same nonce, after the generated folder is deleted"; "leaves a lock owned by another session alone" | `lib/watch/index.ts:startLockGuard`, `sync/session.ts:reassertHeldSession` |
| LC-49 | N one-shots racing for a free lock each end with exit 0 or 75, never by a signal or exit 1; each 75 names its superseder, and the last sync's output stands | in-progress | NEO-WATCH-09 (five held one-shots, four rounds, passing). Known open 1: the config-load race still returns exit 1 under 3-5 simultaneous one-shots | `sync/session.ts:acquireSyncSession`, `sync/session.ts:winLock`, `sync/session-claim.ts:claimFreshLock` |
| LC-50 | a sync's stop handlers are armed before its owner document is visible, so a newcomer's SIGTERM never finds a process without them | done | NEO-WATCH-09; `sync/session-covered-repro.test.ts` "a SIGTERM with a preempt marker, sent the instant the owner document appears, exits the victim 75 every time" | `sync/session-hold.ts:armSession`, `sync/session.ts:winLock` (`onPublish`), `sync/session.ts:acquireSyncSession` (`markHeld`) |
| LC-51 | a lock whose owner names a pid that now runs another process (a different start time) is stale: never signalled, poked or attached to; pid 1 is stale too | done | NEO-WATCH-10 (four legs); `sync/session-identity.test.ts` "tells processes started a second apart apart and reports a dead pid as gone"; "reads an unrelated same-user process under a recorded pid as recycled, never live"; "reads a root-owned pid as recycled when its owner recorded no identity, on any host" | `sync/session-identity.ts:judgeHolder`, `sync/session-identity.ts:ownIdentity`, `sync/session.ts:contendForLock` |
| LC-52 | a one-shot that pokes a resident watch exits 0 (covered) only after the watch's resync covering that poke has finished, with the output current; it exits 1 naming the watch when that resync failed | done | NEO-WATCH-11; `sync/session-covered-repro.test.ts` "a one-shot that pokes a watch mid-resync exits 0 only after the resync that covers it, with the output current"; "a one-shot whose covering resync fails exits 1 naming the watch, then exits 0 once the fix lands"; `sync/session-covered.test.ts` "returns current only after the poked resync has finished"; "returns failed when the covering resync failed" | `sync/session-covered.ts:awaitWatchCoverage`, `lib/watch/handshake.ts:createWatchStatePublisher`, `sync/session-owner.ts:readWatchState` |
| LC-53 | a one-shot that meets a stopping watch (`stopping` in watch-state) waits for its release and syncs for itself, so an edit saved during the stop is never lost; a watch publishes `stopping` before anything settles | done | NEO-WATCH-12; `sync/session-covered.test.ts` "takes a watch that is already stopping for a retake, without poking it"; "waits out a stopping watch, then takes the stale lock it leaves and syncs for itself"; `lib/watch/handshake.test.ts` "publishes stopping before anything else the stop does" | `sync/session-covered.ts:awaitWatchCoverage`, `lib/watch/index.ts:createWatchRun` (`teardown`) |
| LC-54 | a one-shot answers only SIGTERM: Ctrl-C and hangup are default deaths, so a fragment spinning in a CPU loop still dies on Ctrl-C, and the lock it leaves is taken over as stale (LC-18) | done | `sync/session-repro.test.ts` "Ctrl-C stops a one-shot whose fragment spins in a CPU loop, and the next sync takes the stale lock"; `sync/session-hold.test.ts` "a one-shot answers SIGTERM alone: Ctrl-C and hangup stay default deaths a spinning fragment cannot ignore" | `sync/session-hold.ts:signalsFor`, `sync/session-hold.ts:armSession` |

## C. Watch scope, debounce and resync

| id | claim | status | proof | code |
| --- | --- | --- | --- | --- |
| LC-22 | trailing debounce of 60 ms with a 500 ms max-wait: a steady stream of saves still resyncs | done | `lib/watch/scheduler.test.ts` "fires one resync after the settle quiet time"; "caps a reset at the first schedule plus max-wait"; "still resyncs through a 3 s burst that never goes quiet, bounded by max-wait" (pins the exported constants, not the literals) | `lib/watch/scheduler.ts:createResyncScheduler` |
| LC-23 | a burst landing behind an in-flight sync costs exactly one follow-up pass | done | `lib/watch/scheduler.test.ts` "costs exactly one follow-up pass for events that land mid-sync" | `lib/watch/scheduler.ts:request`, `drain` |
| LC-24 | a failing resync reports through onError, and the watch keeps going | done | `lib/watch/scheduler.test.ts` "a rejected pass goes to onError and a later schedule still runs"; "a follow-up requested behind a failing pass still runs" | `lib/watch/scheduler.ts:runPass`; `lib/watch/index.ts:watchSync` |
| LC-25 | add, change and unlink of an included file each resync the sheet (a rename is an unlink plus an add) | done | NEO-SYNC-14 (`specs/watch.spec.ts`: add, rewrite, delete) | `lib/watch/classify.ts:classifyEvent`, `lib/watch/handler.ts:createParcelHandler` |
| LC-26 | only files matching the include globs, or a config dependency, wake the watch; a config edit rebuilds the scope, so widening takes effect and narrowing quiets the removed globs | in-progress | NEO-SYNC-14 (`specs/watch-include.spec.ts`: widen, narrow). Known open 2: a config-dependency file created after a failed config load is never watched | `lib/watch/scope.ts:refreshTriggerScope`, `lib/watch/match.ts:deriveWatchRoots` |
| LC-27 | a relative-path upstream file is a watch input: its rebuild resyncs the consumer | done | NEO-LAYERS-15 (watch leg) | `config/bundle.ts` (dependencyPaths) |
| LC-28 | a bare-specifier upstream rebuild triggers a watch resync | open | none: NEO-LAYERS-15 records it as a known gap; NEO-LAYERS-06 covers the one-process case only. Known open 3 | `config/bundle.ts` keeps inlined paths out of the watch list |
| LC-29 | a watched edit (css, token value, fragment add and delete) repaints the browser after reload | done | NEO-WATCH-01 (`specs/watch-loop.spec.ts`) | `lib/watch/index.ts:watchSync` (`onResync`) |
| LC-30 | a symlinked project root and symlinked sources: the watch matches the files the engine compiles | in-progress | NEO-WATCH-02 (root) and NEO-WATCH-04 (target edit) pass. Known open 7: a new file created inside a symlinked directory target is not seen until another matched event | `lib/watch/match.ts:canonicalPath`, `lib/watch/classify.ts:classifyEvent` |
| LC-31 | dotfiles and gitignored files that match include: the watch matches the files the engine compiles | done | NEO-WATCH-05 (gitignored: the watch ignores exactly the engine's directory set, never `.gitignore`); NEO-WATCH-06 (dotfile: matching is dot-enabled) | `lib/watch/match.ts:ENGINE_IGNORE_GLOBS`, `lib/watch/index.ts:createWatchRun` (`start`) |
| LC-32 | a directory moved into or out of include resyncs with the engine's file set | done | NEO-WATCH-03 (a bare directory move carries no per-file events, so the directory event is a scope change) | `lib/watch/classify.ts:isScopeDirectory`, `lib/watch/match.ts:deriveWatchRoots` |
| LC-33 | a watcher error other than dropped events reports every time and resyncs at most once per 5 s cooldown; a dropped-events error reports nothing and schedules a debounced resync | done | `lib/watch/handler.test.ts` "reports another error and resyncs now, then only once per cooldown"; "schedules a debounced resync for a dropped-events error and reports nothing"; `lib/watch/index.test.ts` "resyncs after a dropped-events error and reports nothing"; NEO-WATCH-14 (a dropped batch still reaches the output) | `lib/watch/handler.ts:createWatcherErrorHandler` |
| LC-55 | a failed resync widens the trigger scope to the live scope plus the latest loaded config, so a fix saved in a newly included dir resyncs; a good sync narrows it back | done | NEO-WATCH-13; `lib/watch/scope.test.ts` "widens after a failed sync so a file in a newly included dir is matched and subscribed"; "narrows after a good sync and unsubscribes the roots the config dropped"; `lib/watch/index.test.ts` "widens the scope after a failed sync, so a fix in a newly included dir resyncs". Known open 2 bounds it: a config-dependency file created after a failed load | `lib/watch/scope.ts:refreshTriggerScope`, `lib/watch/scope.ts:mergeScope`, `lib/watch/index.ts:rebuildScope` |
| LC-56 | a watch subscribes before its baseline sync and buffers what arrives during the baseline, so an edit that lands during boot is in the boot output or resynced right after it | done | NEO-WATCH-15; `lib/watch/index.test.ts` "subscribes before the baseline and resyncs an edit that lands while the baseline runs"; "runs one resync for a poke that lands during the baseline" | `lib/watch/index.ts:createWatchRun` (`start`) |
| LC-57 | a resync that newly subscribes a root runs one catch-up sync, since edits under that root before its subscription were never delivered | done | `lib/watch/index.test.ts` "runs one catch-up sync when a resync subscribes a root it did not have"; `lib/watch/scope.test.ts` "reports a root that cannot be subscribed, leaves it out, and does not count it as added" | `lib/watch/scope.ts:refreshTriggerScope`, `lib/watch/index.ts:createWatchRun` (`start`) |
| LC-58 | a resync pass that never settles: a save behind it prints one stuck line past the 5 s bound and never runs a second pass beside it; SIGINT gives the pass up at the 3 s shutdown bound, exits 1 with the unsettled line, and releases the lock | done | NEO-WATCH-16; `lib/watch/scheduler.test.ts` "a request behind a pass past the stuck bound announces it and still queues one follow-up"; "settle gives a pass that never settles up at the shutdown bound and announces the abandonment"; `cli/output-watch.test.ts` "pins the exit line a shutdown prints when the in-flight sync does not settle". Known open 5: a save behind a wedged pass is reported, not run | `lib/watch/scheduler.ts:createResyncScheduler`, `cli/watch.ts:attachShutdown`, `cli/output.ts:UNSETTLED_SYNC_LINE` |

Notes on group C. How the code facts behind LC-30 and LC-31 were settled, and
one caveat on debounce.

1. Gitignored and engine-only ignores (LC-31): settled. The engine reads no
   `.gitignore` and skips its fixed directory names. The watch now ignores exactly
   that set (`ENGINE_IGNORE_GLOBS`, `lib/watch/match.ts`), so a gitignored include
   match resyncs (NEO-WATCH-05).
2. Dotfiles (LC-31): settled. Include matching is dot-enabled, as the engine's walk
   is (`lib/watch/match.ts`), and NEO-WATCH-06 proves it.
3. Symlinks (LC-30): the watch root is the real path (`canonicalPath`), and a matched
   file reached through a link watches its real target and reports under the link
   path (`lib/watch/match.ts`, `lib/watch/classify.ts`). NEO-WATCH-02 and NEO-WATCH-04
   prove the root and target legs. New files inside a symlinked directory target are
   Known open 7.
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
| LC-39 | a failed types build is reported on the watch resync line | done | NEO-WATCH-08 (a dangling symlink under `theme/` breaks the types build; the failure prints on the resync line, never the success one-liner); `sync/tasty-refresh-failure.test.ts` "hands a drained warm failure to the drainer and keeps it off the background line"; "keeps the background line for an undrained warm failure"; "reports nothing until the lane runs dry, then reports the failure of its last run". Known open 8 is the cause: a dangling link fails the types build while CSS skips it | `cli/watch.ts:runWatch` (`drainFoldedLanding`), `sync/tasty-phase.ts:reportWarmBuild` |
| LC-40 | a failed types build makes a one-shot `ref sync` exit 1 | open | none; the code path exists | `cli/sync.ts:runSyncCommand` |
| LC-59 | a warm tasty landing reports its warnings the way the cold build does: the watch resync line carries the count, and under `--json` the array carries the warnings | done | NEO-WATCH-18 (the first resync line after a save reads `1 warning`); `sync/tasty-phase-landing.test.ts` "hands a drained landing its count and diagnostics, with no summary printed"; "prints the warning summary for an undrained landing, as a background landing does"; "prints an undrained json landing as one diagnostics array on stdout" | `sync/tasty-phase.ts:reportWarmBuild`, `cli/watch.ts:drainFoldedLanding` |

## E. Signals and shutdown

| id | claim | status | proof | code |
| --- | --- | --- | --- | --- |
| LC-41 | SIGINT, SIGTERM and SIGHUP stop a booted watch gracefully: the in-flight sync settles, the lock goes, and the process exits 0 by code | done | `sync/session-repro.test.ts` "%s stops an idle watch by code and releases the lock: the next sync proceeds with no stale warning" (SIGINT, SIGHUP); NEO-CLI-02 (SIGTERM exits 0, not by signal) | `cli/watch.ts:attachShutdown`; `lib/watch/index.ts:createWatchRun` (`teardown`) |
| LC-42 | a repeated stop signal while stopping is ignored: one stop, and the lock is held to the end | done | `sync/session-repro.test.ts` "a second signal while stopping is ignored: one stop, the lock held to the end, exit 0" | `cli/watch.ts:attachShutdown` |
| LC-43 | a stop signal during the baseline sync, before shutdown is armed, frees the lock and dies by that signal | open | none; the intent is written in `sync/session-hold.ts:makeStopHandler` | `cli/watch.ts:runWatch` arms shutdown only after `watchSync` resolves |
| LC-44 | a one-shot frees its lock at once on SIGTERM; SIGINT and SIGHUP are default deaths that leave a stale lock for the next sync to take over (LC-54) | done | `sync/session-hold.test.ts` "a one-shot frees its lock at once on SIGTERM even with a graceful shutdown around" | `sync/session-hold.ts:makeStopHandler`, `sync/session-hold.ts:signalsFor` |
| LC-45 | a one-shot re-raises its SIGTERM and dies by it, after freeing its lock | done | NEO-CLI-01 (the interrupted sync dies by SIGTERM after its first publish; the next sync restores) | `sync/session-hold.ts:makeStopHandler` |
| LC-60 | a SIGTERM delivered mid-commit is honored: the commit finishes or rolls back, the sync ends by SIGTERM or a non-zero exit, and it releases its lock | done | NEO-WATCH-22 (the spec accepts SIGTERM or a non-zero exit, and the folder is the new or the last-good state) | `sync/index.ts:yieldToEventLoop`, `sync/index.ts:sync` |

## F. Output and warnings

| id | claim | status | proof | code |
| --- | --- | --- | --- | --- |
| LC-61 | under `--json`, a failed resync prints its human line on stderr and one stdout diagnostics array holding a single codeless error row | done | NEO-WATCH-17; `cli/output-watch.test.ts` "is a codeless error row that prints as a one-row diagnostics array" | `cli/watch.ts:runWatch` (`onError`), `cli/output.ts:syncFailureEntry`, `cli/output.ts:formatJsonDiagnostics` |
| LC-62 | an include glob that matches no file warns by name, in verbose and `--json` output, and the sync still exits 0 | done | NEO-WATCH-23; `sync/include-check.test.ts` "warns once, naming only the dead positive patterns"; "reads a single dead include as one pattern, and points at the config to fix"; "stays silent when every include reaches a file" | `sync/include-check.ts:includeMatchDiagnostics` |

## Known open

These are gaps the claims above do not cover. Each names the claims it affects.
They are not approved absences: each one is open work.

1. Contention under 3-5 simultaneous one-shots fails ~6/25 runs with `Failed to load ui.config.ts ... mkdtemp .reference-ui/tmp/config-eval-*`. `src/config/evaluate.ts` races. Owner: src/config team. Patch: `/private/tmp/claude-501/-Users-ryn-Developer-reference-ui/d7205559-980d-47ff-8cba-0a8a2876766f/scratchpad/cookS/evaluate-retry.patch`. Affects LC-49.
2. A config-dependency file created after a failed config load is never watched (`src/config/load.ts`). Affects LC-26 and LC-55.
3. An upstream system re-synced via `node_modules` never reaches a downstream watch (`src/config/bundle.ts`). Affects LC-28.
4. A config with a never-settling top-level await makes a one-shot exit 13 with no `[ref]` line (`src/config/load.ts`). Affects LC-07.
5. A save behind a wedged pass is reported, not run (by design: no second writer). Affects LC-58.
6. The sync stage dir is shared, not per session (the stage name leaks into generated bytes), so a displaced sync still in assembly can write the shared stage until assembly returns. Affects LC-48.
7. New files created inside a symlinked directory target are not seen until another matched event. Affects LC-30.
8. One dangling symlink under `include` hard-fails the types build (Rust tasty `file_discovery` follows links), while CSS skips it silently. Affects LC-39.

## Out of scope and approved absences

- approved-absence: no `session.json` sentinel. Readiness is the watcher's `onResync` (NEO-WATCH-01 README).
- approved-absence: the matrix contract's webpack leg is not ported; Neo has no webpack target (H5 retire).
- out of scope: Windows. The poke and signal legs are POSIX-only (`it.skipIf(!POSIX)`), so no claim covers win32.
- out of scope, other groups: the normalizeCss reset injection (`sync/reset.ts`, NEO-LAYER-04) and the bench phase marks (`sync/phases.ts`) carry no lifecycle claim.
- NEO-WATCH-09 to 23 landed from the doom round. NEO-WATCH-24 and up are unassigned.

# CORE-WATCH — watch lifecycle case group

This group proves the lifecycle of `ref sync --watch` and the syncs it drives:
how the generated folder is published and replaced, who holds it, what a watch
sees and when it resyncs, how the types build keeps up, and how the processes
stop. Browser paint after a watched edit is one leg of that lifecycle, not the
whole group. `SPEC.md` numbers the claims (LC-nn, grouped A to F), names the
proof for each, and lists the known open gaps at its end. `TESTS.md` is the
case ledger.

Ports the browser-paint leg of the matrix watch contract
(`matrix/watch/tests/e2e/watch-contract.spec.ts`) to Core: file mutation →
watch resync → browser paint. Readiness is the watcher's `onResync` callback,
since Core emits no `session.json` sentinel.

## Where each leg is proven today

- node-side resync on add, change and unlink, and include scope: CORE-SYNC-14
- the spawned `ref sync --watch` boot and SIGTERM shutdown: CORE-CLI-02
- a killed one-shot recovering on the next sync: CORE-CLI-01
- failed-sync atomicity (last-good folder kept): CORE-SYNC-11
- commit, lock, scheduler and tasty contracts: the unit and repro tests that
  `SPEC.md` names
- browser paint after a watched edit: CORE-WATCH-01 (this group)
- the legs this group adds, each in its own case: symlinked roots and targets,
  gitignored and dotfile includes, lock re-assert, the types-build failure line,
  contention and recycled pids, covered and stopping one-shots, boot and
  dropped-event saves, wedged passes, `--json` output, tasty warnings, commit
  rollback, break-lock, a file in the way of a generated dir, SIGTERM mid-commit
  and dead include globs: CORE-WATCH-02 to 23, plus dangling symlinks under
  include and new files inside a symlinked directory target: CORE-WATCH-24 and 25

Each case proves one or more `LC-nn` claims. Gaps the claims do not cover are
in the Known open section of `SPEC.md`.

## Cases

- CORE-WATCH-01 — live-edit→paint loop: css edit, token-value edit, fragment add and delete each repaint the browser.
- CORE-WATCH-02 — a watch started through a symlinked project root resyncs a new css() file.
- CORE-WATCH-03 — a directory moved into include resyncs its class in, and moved out drops it.
- CORE-WATCH-04 — an edit to a symlink's target resyncs the class the link serves.
- CORE-WATCH-05 — an edit to a gitignored file that include matches resyncs its class.
- CORE-WATCH-06 — an edit to a dotfile that include matches resyncs its class.
- CORE-WATCH-07 — deleting the generated folder under a live watch re-asserts its lock, so a one-shot reports covered.
- CORE-WATCH-08 — a watch resync whose types build fails reports the failure, then recovers on the next good save.
- CORE-WATCH-09 — concurrent one-shots end in exit 0 or 75, never by a signal or exit 1, and the last sync wins.
- CORE-WATCH-10 — a lock whose pid was recycled to an unrelated process is stale: never signalled, attached to, or obeyed.
- CORE-WATCH-11 — a one-shot covered by a resident watch exits 0 only after the watch's output reflects the saved edit.
- CORE-WATCH-12 — a one-shot that meets a stopping watch syncs for itself, so an edit saved during the stop is never lost.
- CORE-WATCH-13 — a fix to a fragment that failed in a newly included dir resyncs the watch.
- CORE-WATCH-14 — a save whose event batch the OS drops still reaches the output through a watch re-scan.
- CORE-WATCH-15 — an edit that lands while the watch boots is in its boot sync or resynced after it.
- CORE-WATCH-16 — a wedged watch sync reports stuck on the next save, and SIGINT exits it within the shutdown bound.
- CORE-WATCH-17 — a failed resync under --json prints one stdout diagnostics array that holds its failure.
- CORE-WATCH-18 — a tasty warning raised by a save reaches the watch's resync line with its count.
- CORE-WATCH-19 — a commit that fails partway puts back every live file it replaced, so the folder is byte-identical.
- CORE-WATCH-20 — --break-lock over a sync frozen mid-commit leaves the folder equal to a clean rebuild.
- CORE-WATCH-21 — a generated directory replaced by a file heals on the next sync instead of failing with EEXIST.
- CORE-WATCH-22 — a SIGTERM delivered mid-commit is honored: the commit finishes or rolls back, then the sync ends and releases its lock.
- CORE-WATCH-23 — an include glob that matches no files warns by name and the sync still exits 0.
- CORE-WATCH-24 — a dangling symlink under include warns once by name, and the sync still builds CSS and types.
- CORE-WATCH-25 — a new file inside a symlinked directory target resyncs the class the link serves.

The matrix contract's webpack dual-consumption leg is not ported. The H5
default retire stands, and Core has no webpack target.

## Shared helper

`shared/commit-world.ts` carries the temp-world harness the WATCH-19..23 commit specs share: spawned `ref` CLI,
commit pause-point driver, folder snapshots, and disposal.

Parent: [tests/cases/](../README.md).

> Search terms: watch lifecycle, watch paint loop, live edit repaint, file mutation paint, watch resync paint, session lock, staged publish, atomic commit, debounce, watch scope, stop signals, types refresh, onResync, P-watch-1, watch port, covered one-shot, watch-state, lock contention, recycled pid, stopping watch, commit rollback, break-lock, file in the way, SIGTERM mid-commit, include glob warning, json failure array, boot edit, dropped events, wedged sync, LC-01, CORE-SYNC-14, CORE-CLI-02

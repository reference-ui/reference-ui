# NEO-WATCH — watch lifecycle case group

This group proves the lifecycle of `ref sync --watch` and the syncs it drives:
how the generated folder is published and replaced, who holds it, what a watch
sees and when it resyncs, how the types build keeps up, and how the processes
stop. Browser paint after a watched edit is one leg of that lifecycle, not the
whole group. `SPEC.md` numbers the claims (LC-nn, grouped A to F), names the
proof for each, and lists the known open gaps at its end. `TESTS.md` is the
case ledger.

Ports the browser-paint leg of the matrix watch contract
(`matrix/watch/tests/e2e/watch-contract.spec.ts`) to Neo: file mutation →
watch resync → browser paint. Readiness is the watcher's `onResync` callback,
since Neo emits no `session.json` sentinel.

## Where each leg is proven today

- node-side resync on add, change and unlink, and include scope: NEO-SYNC-14
- the spawned `ref sync --watch` boot and SIGTERM shutdown: NEO-CLI-02
- a killed one-shot recovering on the next sync: NEO-CLI-01
- failed-sync atomicity (last-good folder kept): NEO-SYNC-11
- commit, lock, scheduler and tasty contracts: the unit and repro tests that
  `SPEC.md` names
- browser paint after a watched edit: NEO-WATCH-01 (this group)
- the legs this group adds, each in its own case: symlinked roots and targets,
  gitignored and dotfile includes, lock re-assert, the types-build failure line,
  contention and recycled pids, covered and stopping one-shots, boot and
  dropped-event saves, wedged passes, `--json` output, tasty warnings, commit
  rollback, break-lock, a file in the way of a generated dir, SIGTERM mid-commit
  and dead include globs: NEO-WATCH-02 to 23, plus dangling symlinks under
  include and new files inside a symlinked directory target: NEO-WATCH-24 and 25

Each case proves one or more `LC-nn` claims. Gaps the claims do not cover are
in the Known open section of `SPEC.md`.

## Cases

- NEO-WATCH-01 — live-edit→paint loop: css edit, token-value edit, fragment add and delete each repaint the browser.
- NEO-WATCH-02 — a watch started through a symlinked project root resyncs a new css() file.
- NEO-WATCH-03 — a directory moved into include resyncs its class in, and moved out drops it.
- NEO-WATCH-04 — an edit to a symlink's target resyncs the class the link serves.
- NEO-WATCH-05 — an edit to a gitignored file that include matches resyncs its class.
- NEO-WATCH-06 — an edit to a dotfile that include matches resyncs its class.
- NEO-WATCH-07 — deleting the generated folder under a live watch re-asserts its lock, so a one-shot reports covered.
- NEO-WATCH-08 — a watch resync whose types build fails reports the failure, then recovers on the next good save.
- NEO-WATCH-09 — concurrent one-shots end in exit 0 or 75, never by a signal or exit 1, and the last sync wins.
- NEO-WATCH-10 — a lock whose pid was recycled to an unrelated process is stale: never signalled, attached to, or obeyed.
- NEO-WATCH-11 — a one-shot covered by a resident watch exits 0 only after the watch's output reflects the saved edit.
- NEO-WATCH-12 — a one-shot that meets a stopping watch syncs for itself, so an edit saved during the stop is never lost.
- NEO-WATCH-13 — a fix to a fragment that failed in a newly included dir resyncs the watch.
- NEO-WATCH-14 — a save whose event batch the OS drops still reaches the output through a watch re-scan.
- NEO-WATCH-15 — an edit that lands while the watch boots is in its boot sync or resynced after it.
- NEO-WATCH-16 — a wedged watch sync reports stuck on the next save, and SIGINT exits it within the shutdown bound.
- NEO-WATCH-17 — a failed resync under --json prints one stdout diagnostics array that holds its failure.
- NEO-WATCH-18 — a tasty warning raised by a save reaches the watch's resync line with its count.
- NEO-WATCH-19 — a commit that fails partway puts back every live file it replaced, so the folder is byte-identical.
- NEO-WATCH-20 — --break-lock over a sync frozen mid-commit leaves the folder equal to a clean rebuild.
- NEO-WATCH-21 — a generated directory replaced by a file heals on the next sync instead of failing with EEXIST.
- NEO-WATCH-22 — a SIGTERM delivered mid-commit is honored: the commit finishes or rolls back, then the sync ends and releases its lock.
- NEO-WATCH-23 — an include glob that matches no files warns by name and the sync still exits 0.
- NEO-WATCH-24 — a dangling symlink under include warns once by name, and the sync still builds CSS and types.
- NEO-WATCH-25 — a new file inside a symlinked directory target resyncs the class the link serves.

The matrix contract's webpack dual-consumption leg is not ported. The H5
default retire stands, and Neo has no webpack target.

> Search terms: watch lifecycle, watch paint loop, live edit repaint, file mutation paint, watch resync paint, session lock, staged publish, atomic commit, debounce, watch scope, stop signals, types refresh, onResync, P-watch-1, watch port, covered one-shot, watch-state, lock contention, recycled pid, stopping watch, commit rollback, break-lock, file in the way, SIGTERM mid-commit, include glob warning, json failure array, boot edit, dropped events, wedged sync, LC-01, NEO-SYNC-14, NEO-CLI-02

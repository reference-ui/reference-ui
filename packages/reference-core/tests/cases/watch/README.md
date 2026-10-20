# CORE-WATCH — watch lifecycle case group

This group proves the lifecycle of `ref sync --watch` and the syncs it drives:
how the generated folder is published and replaced, who holds it, what a watch
sees and when it resyncs, how the types build keeps up, and how the processes
stop. Browser paint after a watched edit is one leg of that lifecycle, not the
whole group.

The browser-paint leg — file mutation → watch resync → browser paint —
lives in CORE-WATCH-01. Readiness is the watcher's `onResync` callback,
since Core emits no session sentinel.

Claims are numbered `LC-nn`, grouped A (staged publish and commit) to F
(output and warnings); each case proves one or more of them. Status words
follow SYNC: `open`, `in-progress`, `done`, `blocked-on-rs`,
`approved-absence`, `retired`. Counts: 65 claims, 62 done, 3 open.

Open: LC-04 (a reader never sees a torn live file — the live-reader test
counts misses and errors, never content); LC-40 (a failed types build
makes a one-shot `ref sync` exit 1 — the code path exists, no proof);
LC-43 (a stop signal during the baseline sync, before shutdown is armed,
frees the lock and dies by that signal — intent written, no proof).

Known open gaps the claims do not cover (open work, not approved
absences): a save behind a wedged pass is reported, not run — no second
writer by design (affects LC-58, pinned by CORE-WATCH-16); the sync stage
dir is shared, not per session, so a displaced sync still in assembly can
write the shared stage until assembly returns (affects LC-48, pinned by
CORE-WATCH-20).

Scope: POSIX-only. The poke and signal legs skip on win32, so no claim
covers Windows. Debounce is proven at unit level only (scheduler tests),
not by a case leg. The config-evaluation timeout bound (30 s,
`CONFIG_EVALUATION_TIMEOUT_MS`) must stay past CORE-WATCH-16's shutdown
window (about 10 s); the bound covers config evaluation only — a
fragment or tasty pass that never settles is bounded by LC-58's stuck
line and SIGINT exit alone.

Thirty-one cases carry the group (CORE-WATCH-01 to 31); CORE-WATCH-32 and
up are unassigned.

No webpack dual-consumption leg: Core has no webpack target.

## Shared helper

The shared commit-world helper carries the temp-world harness the WATCH-19..23 commit specs share: spawned `ref` CLI,
commit pause-point driver, folder snapshots, and disposal.

> Search terms: watch lifecycle, watch paint loop, live edit repaint, file mutation paint, watch resync paint, session lock, staged publish, atomic commit, debounce, watch scope, stop signals, types refresh, onResync, P-watch-1, watch port, covered one-shot, watch-state, lock contention, recycled pid, stopping watch, commit rollback, break-lock, file in the way, SIGTERM mid-commit, include glob warning, json failure array, boot edit, dropped events, wedged sync, LC-01, CORE-SYNC-14, CORE-CLI-02

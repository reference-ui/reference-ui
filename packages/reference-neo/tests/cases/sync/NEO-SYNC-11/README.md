# NEO-SYNC-11 — a compile diagnostic fails sync with file and line, and no folder is half-written

Evidence: `[atm]` ATM-DIAG-01..03, ATM-TOKEN-12.

This case opts OUT of the runner sync hook (`"sync": false`): the world
carries a failing compile, so the hook would fail before any spec runs.
Instead the spec drives `sync()` itself node-side and asserts it rejects
with `bad.ts:3` in the message and leaves no `.reference-ui/` behind — the
folder is atomic. The failing input is a missing `{colors.nope}` token ref,
the RS-3 located error (ATM-TOKEN-12 pins file, line, column); the row's
`display: true` cannot serve because the engine answers it with an
unlocated warning and sync succeeds by design (warn-and-skip, consistent
with SITE-06/D11 — the spec pins that contrast with a temp world). This
surfacing unblocks NEO-TOKEN-02: the missing-ref diagnostic now reaches
authors named with file and line.

> Search terms: all-or-nothing, located-error, rollback, poison-world, fail closed, no half folder, sync/diagnostic-failure, sync/atomic-write, ATM-DIAG-02, ATM-DIAG-03, NEO-SYNC-08

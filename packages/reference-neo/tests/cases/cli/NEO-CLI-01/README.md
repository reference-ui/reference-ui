# NEO-CLI-01 — `neo` CLI lifecycle: interrupt recovery and clean restore

Evidence: `[core]` CLI lifecycle (`matrix/distro/tests/unit/distro.test.tsx`
L280-446: idempotent re-sync, stale runtime rewrite, SIGTERM-interrupt
recovery, clean-restore round-trip).

The runner syncs this world fresh, then the spec drives the real spawned
`neo` binary through four lifecycle legs. An idempotent re-sync proves a
second `neo sync` is a byte-identical no-op with working consumer imports.
A stale rewrite poisons the three generated runtimes and proves a cold sync
heals every marker. An interrupt recovery cleans, spawns `neo sync`, kills
it by SIGTERM the moment the first published file lands, and proves the
next sync restores the full folder with working imports. A clean-restore
round-trip proves `neo clean` removes the generated folder plus the scope
links and the next sync brings both back. Every leg ends on a verified
sync, and a final heal sync runs in a `finally`, so the world is green
for the next run even when an assertion fails.

The distro core's virtual-mirror legs (L288-358: stale virtual cleanup and
the exact-sync pin) are deliberately not ported: Neo has no virtual mirror
by design (`sync/index.ts`, SYNC-02), so there is no mirror to keep exact.
The skipped sentinel test (L440-442) stays skipped — Neo emits no sentinel.
The distro type-surface describes stay with the TYPE group, and the
Panda-shaped output pins are Neo-forbidden. This case is the one coverage
home for the CLI-lifecycle behavior; the matrix file is the interim keep
it releases.

> Search terms: cli lifecycle, neo sync, neo clean, interrupt recovery, sigterm recovery, kill recovery, stale rewrite, stale runtime, idempotent resync, clean restore, scope links, import probe, P-cli-1, distro port, NEO-SYNC-01, NEO-SYNC-11

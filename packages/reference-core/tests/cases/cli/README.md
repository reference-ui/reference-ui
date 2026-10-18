# CORE-CLI — `core` CLI lifecycle case group

Ports the matrix distro CLI-lifecycle core
(`matrix/distro/tests/unit/distro.test.tsx` L280-446) to Core: the
behaviors that need the real `core` binary to prove — idempotent
re-sync, stale runtime rewrite, SIGTERM-interrupt recovery, and the
clean-restore round-trip. The distro suite's virtual-mirror legs are
deliberately not ported (Core has no virtual mirror by design), and
its type-surface describes stay with the TYPE group.

> Search terms: cli lifecycle, core sync, core clean, interrupt recovery, kill recovery, stale rewrite, idempotent resync, clean restore, P-cli-1, distro port

## Cases

- CORE-CLI-01 — CLI lifecycle: idempotent re-sync, stale rewrite,
  interrupt recovery, and clean restore against the spawned binary.
- CORE-CLI-02 — Watch flag path: spawned `core sync --watch` boot,
  token-edit resync with sheet change, and SIGTERM shutdown.

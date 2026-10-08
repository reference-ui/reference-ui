# NEO-CLI — `neo` CLI lifecycle case group

Ports the matrix distro CLI-lifecycle core
(`matrix/distro/tests/unit/distro.test.tsx` L280-446) to Neo: the
behaviors that need the real `neo` binary to prove — idempotent
re-sync, stale runtime rewrite, SIGTERM-interrupt recovery, and the
clean-restore round-trip. The distro suite's virtual-mirror legs are
deliberately not ported (Neo has no virtual mirror by design), and
its type-surface describes stay with the TYPE group.

> Search terms: cli lifecycle, neo sync, neo clean, interrupt recovery, kill recovery, stale rewrite, idempotent resync, clean restore, P-cli-1, distro port

## Cases

- NEO-CLI-01 — CLI lifecycle: idempotent re-sync, stale rewrite,
  interrupt recovery, and clean restore against the spawned binary.
- NEO-CLI-02 — Watch flag path: spawned `neo sync --watch` boot,
  token-edit resync with sheet change, and SIGTERM shutdown.

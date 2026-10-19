# CORE-CLI — `core` CLI lifecycle case group

Proves the CLI lifecycle against the real `core` binary — the
behaviors that need it to prove: idempotent re-sync, stale runtime
rewrite, SIGTERM-interrupt recovery, and the clean-restore
round-trip. No virtual-mirror legs: Core has no virtual mirror by
design. Type-surface coverage stays with the TYPE group.

> Search terms: cli lifecycle, core sync, core clean, interrupt recovery, kill recovery, stale rewrite, idempotent resync, clean restore, P-cli-1, distro port

Two cases carry the group: CORE-CLI-01 proves the lifecycle against
the spawned binary, and CORE-CLI-02 proves the `--watch` flag path
from boot through token-edit resync to SIGTERM shutdown.

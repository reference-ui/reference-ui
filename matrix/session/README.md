# Session Matrix

This package is the matrix-owned contract for session manifests and one-shot lifecycle cleanup.

It proves:

- `session.json` is written after a completed one-shot sync
- the manifest has the expected shape and timestamp ordering
- the one-shot session transitions to `stopped` with `buildState=ready`
- `session.lock` is removed after cleanup

Runner contract:

- tests live under `tests/unit`
- the package runs with full `ref sync` before tests
- Vitest owns the assertions because the contract is filesystem- and lifecycle-focused
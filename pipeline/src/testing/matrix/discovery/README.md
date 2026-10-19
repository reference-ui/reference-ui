# Matrix Discovery

Finds matrix-enabled packages and parses their contracts. Scans `matrix/tests/` recursively (nested suites like `chain/T8` included) and maps each `matrix.json` to its workspace package as `@matrix/<name>`.

A package participates when its `matrix.json` declares `name`, `refSync.mode` (`full` | `watch-ready`), a non-empty `bundlers` array (`vite7` | `webpack5`), and `react` (one runtime or a non-empty array; the first unique entry is the default). `--react` pins one declared runtime; `--full` expands every declared runtime.

Parent: [matrix/README.md](../README.md).

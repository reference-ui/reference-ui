# Tasty tests

- **Rust** (`pnpm agentrs c tasty`): scanner, AST, and resolver unit tests. No bundle emission.
- **Vitest** (`pnpm agentrs v tasty`): station runner plus JS API tests against the compiled N-API addon.

Layout: `cases/<ID>/` holds one folder per station, named by its raw id (`TST-<AREA>-NN`). `suites/` holds the Vitest entry points (`cases.test.ts` runs every station; `scratch-isolation.test.ts` guards the scratch roots), and `harness/` holds the shared helpers (`helpers.ts`, `api-test-helpers.ts`). Only directories and this README live at the top level.

Each `cases/TST-*` station has `input/`, `spec.ts`, `README.md`, and committed `output/` goldens (`manifest.js`, `chunks.json`). Compilation is on demand. Each test file emits into its own root, `modules/tasty/.scratch/run-<pid>-<id>/<station>/` (gitignored, beside `tests/` because the scanner walks all of `tests/`), and removes that root in `afterAll` through `disposeTastyScratch`, so files and runs never share a station directory. Goldens are not rewritten unless you pass `--update-goldens`.

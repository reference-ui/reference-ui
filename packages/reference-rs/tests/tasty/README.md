# Tasty tests

Two test suites:

- **Rust** (`pnpm test:rust` / `cargo test`): unit and smoke tests for the scanner, AST, and resolver. No bundle emission; output correctness is tested in Vitest.
- **Vitest** (`pnpm test:vitest`): uses the **compiled napi-rs runtime** in globalSetup to emit bundles, then loads and asserts on their shape and content.

**Full test run:** `pnpm test` ensures the native binary is built, runs Rust tests, then Vitest (which emits bundles via the native addon and runs bundle tests).

**Layout:**

- **`cases/`** – one folder per scenario. Each case contains `input/`, a local `bundle.test.ts`, and generated `output/bundle.js` plus `output/perf-metrics.txt`.
- **Shared fixture deps** – `package.json`, `package-lock.json`, and `node_modules/` live at the `tests/tasty/` root so each case can resolve the same external packages.
- **Vitest setup** – `globalSetup.ts` scans each `cases/{scenario}/input/` folder, writes generated output back to `cases/{scenario}/output/`, and records native API timing in `perf-metrics.txt`.

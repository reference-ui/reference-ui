# TypeScript scanner tests

Two test suites:

- **Rust** (`pnpm test:rust` / `cargo test`): unit and smoke tests for the scanner, AST, and resolver. No output-file assertions.
- **Vitest** (`pnpm test:vitest`): loads the emitted bundles and asserts on their shape and content. Requires bundles to be emitted first.

**Full test run:** `pnpm test` runs Rust tests, then emits bundles, then Vitest.

**Layout (same as before):**

- **`input/`** – scenario folders (e.g. `scan_here/`). Each direct subfolder is one scenario; see `input/README.md`.
- **`output/`** – emitted bundles, one folder per scenario: `output/{scenario}/bundle.js` and `bundle-metrics.txt`. See `output/README.md`.

To emit bundles without running Vitest: `cargo run --bin emit-test-bundles` (or `pnpm test:emit` if wired).

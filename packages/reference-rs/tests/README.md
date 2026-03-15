# TypeScript scanner tests

Two test suites:

- **Rust** (`pnpm test:rust` / `cargo test`): unit and smoke tests for the scanner, AST, and resolver. No bundle emission; output correctness is tested in Vitest.
- **Vitest** (`pnpm test:vitest`): uses the **compiled napi-rs runtime** in globalSetup to emit bundles, then loads and asserts on their shape and content.

**Full test run:** `pnpm test` ensures the native binary is built, runs Rust tests, then Vitest (which emits bundles via the native addon and runs bundle tests).

**Layout:**

- **`input/`** – scenario folders (e.g. `generics/`, `external_libs/`). Each direct subfolder is one scenario; see `input/README.md`.
- **`output/`** – emitted bundles, one folder per scenario: `output/{scenario}/bundle.js`. Emitted by Vitest globalSetup using the native `scanAndEmitBundle` binding. See `output/README.md`.
- **Test files** – `bundle.{scenario}.test.ts` (e.g. `bundle.generics.test.ts`, `bundle.external_libs.test.ts`) load and assert on the corresponding bundle.

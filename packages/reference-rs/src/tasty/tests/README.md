# TypeScript scanner Rust tests

Rust tests in this module are **smoke tests only** (scanner runs; no bundle emission).  
All **output correctness** tests live in Vitest under `tests/tasty/`.

- **Fixtures (cases):** Use `tests/tasty/cases/` (see `packages/reference-rs/tests/tasty/cases/README.md`).  
  `tests_dir()` in `mod.rs` points to `CARGO_MANIFEST_DIR/tests/tasty`, and Rust smoke tests install shared fixture deps from `tests/tasty/`.
- **Vitest:** `tests/tasty/globalSetup.ts` uses the compiled napi-rs runtime (`scanAndEmitBundle`) to emit bundles; `tests/tasty/cases/*/bundle.test.ts` then load and assert on their shape.

Run the full suite: `pnpm test` (Rust then Vitest).

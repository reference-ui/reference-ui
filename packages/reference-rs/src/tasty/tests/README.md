# TypeScript scanner Rust tests

Rust tests in this module are **smoke tests only** (scanner runs; no bundle emission).  
All **output correctness** tests live in Vitest under `tests/tasty/`.

- **Fixtures (input/output):** Use `tests/tasty/` (see `packages/reference-rs/tests/tasty/README.md`).  
  `tests_dir()` in `mod.rs` points to `CARGO_MANIFEST_DIR/tests/tasty`.
- **Vitest:** `tests/tasty/globalSetup.ts` uses the compiled napi-rs runtime (`scanAndEmitBundle`) to emit bundles; `tests/tasty/*.test.ts` then load and assert on their shape.

Run the full suite: `pnpm test` (Rust then Vitest).

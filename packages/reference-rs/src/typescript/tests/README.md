# TypeScript scanner Rust tests

Rust tests in this module are **smoke tests only** (scanner runs, bundles are emitted).  
All **output correctness** tests live in Vitest at the **top-level** `tests/` directory.

- **Fixtures (input/output):** Use the top-level `tests/` folder (see `packages/reference-rs/tests/README.md`).  
  `tests_dir()` in `mod.rs` points to `CARGO_MANIFEST_DIR/tests`.
- **Vitest:** `tests/*.test.ts` load the emitted bundles and assert on their shape.

Run the full suite: `pnpm test` (Rust then Vitest).

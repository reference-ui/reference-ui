# TypeScript scanner Rust tests

Rust tests in this module are **smoke tests only** (scanner runs; no bundle emission).  
All **output correctness** tests live in Vitest under `modules/tasty/tests/` (station cases in `tests/cases/`, the runner in `tests/suites/`).

- **Fixtures (cases):** Use `modules/tasty/tests/cases/` (see `modules/tasty/tests/cases/README.md`). Rust smoke tests build their inputs in temp dirs (`fixtures.rs`), not under `tests/`.
- **Vitest:** `tests/suites/cases.test.ts` compiles each station on demand through `tests/harness/helpers.ts`, which uses the compiled napi-rs runtime (`scanAndEmitModules`) to emit manifest-plus-chunks artifacts; the station specs then assert on their shape and goldens.

Run the full suite: `pnpm test` (Rust then Vitest).

//! Rust-side smoke tests for the TypeScript scanner. Bundle output is emitted by the
//! compiled napi-rs runtime in Vitest globalSetup; Vitest tests under
//! `tests/tasty/cases/*/bundle.test.ts` then load and assert on that output.

mod scanner;

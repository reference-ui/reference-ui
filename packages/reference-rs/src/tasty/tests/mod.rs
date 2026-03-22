//! Rust-side smoke tests for the TypeScript scanner. Bundle output is emitted by the
//! compiled napi-rs runtime in Vitest globalSetup; Vitest tests under
//! `tests/tasty/cases/*/bundle.test.ts` then load and assert on that output.

mod error_paths;
mod extract;
mod resolve;
mod scanner;
mod type_ref_map_identity;
mod type_ref_map;
mod type_ref_proptest;

//! Rust-side smoke tests for the TypeScript scanner. Bundle output is emitted by the
//! compiled napi-rs runtime when Vitest runs a station; the station specs under
//! `modules/tasty/tests/cases/<ID>/spec.ts` then load and assert on that output.

mod error_paths;
mod extract;
pub(crate) mod fixtures;
mod import_path_proptest;
mod resolve;
mod scanner_imports_proptest;
mod type_ref_map;
mod type_ref_map_identity;
mod type_ref_proptest;

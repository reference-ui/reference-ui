//! Serde + `ts_rs` contract types for the JS Tasty runtime (`js/tasty/generated/`).
//!
//! Most structs here are **never constructed in Rust**: they exist so `TS` derives
//! export stable TypeScript and the hand-written string emitter in
//! `generator/types` stays aligned with that shape. `TastyManifest` (and index
//! entries) are the exception — see `generator/bundle/modules/manifest.rs`.
#![allow(dead_code)]

mod docs;
mod members;
mod module_artifacts;
mod symbols;
mod types;

pub use self::docs::*;
pub use self::members::*;
pub use self::module_artifacts::*;
pub use self::symbols::*;
pub use self::types::*;

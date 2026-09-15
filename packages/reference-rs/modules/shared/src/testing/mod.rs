//! Shared testing utilities, fixtures, and scratch workspace builders for Rust compiler crates.
//! Exports RAII scratch workspace helpers and standardized base system configurations.
//! Ensures uniform test fixture generation and process-safe temporary filesystem management.
//! Prevents test state pollution and duplicate mock definitions across workspace crates.

pub mod base_system;
pub mod workspace;

pub use base_system::*;
pub use workspace::*;

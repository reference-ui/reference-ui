//! TypeScript scanning and bundle generation.
//!
//! This module owns the Rust-side scanner that turns user TypeScript source into
//! a portable, self-contained metadata bundle for docs and MCP use cases.

mod model;
mod scan;

#[cfg(test)]
mod tests;

pub use model::{ScanRequest, TsSymbolKind, TypeRef, TypeScriptBundle};
pub use scan::scan_typescript_bundle;

//! TypeScript scanning and bundle generation.
//!
//! This module owns the Rust-side scanner that turns user TypeScript source into
//! a portable, self-contained metadata bundle for docs and MCP use cases.

mod api;
mod ast;
mod generator;
mod scan;
mod scanner;

#[cfg(test)]
mod tests;

#[allow(unused_imports)]
pub use api::{
    ScanRequest, TsSymbolKind, TsTypeParameter, TypeOperatorKind, TypeRef, TypeScriptBundle,
};
pub use scan::scan_and_emit_bundle;
#[allow(unused_imports)]
pub use scan::scan_typescript_bundle;

//! TypeScript scanning and bundle generation.
//!
//! This module owns the Rust-side scanner that turns user TypeScript source into
//! a portable, self-contained metadata bundle for docs and MCP use cases.

mod ast;
mod constants;
mod emitted;
mod generator;
mod model;
mod request;
mod scan;
mod scanner;
mod shared;

#[cfg(test)]
mod tests;

#[allow(unused_imports)]
pub use emitted::*;
pub use request::ScanRequest;
pub use scan::scan_and_emit_modules;
#[allow(unused_imports)]
pub use scan::scan_typescript_bundle;

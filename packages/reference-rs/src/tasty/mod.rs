//! TypeScript scanning and bundle generation.
//!
//! This module owns the Rust-side scanner that turns user TypeScript source into
//! a portable, self-contained metadata bundle for docs and MCP use cases.
//!
//! `emitted::*` and [`scan::scan_typescript_bundle`] are re-exported for embedders and
//! tests; they are not referenced from this module tree, so `unused_imports` is
//! suppressed on those lines only.

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
#[cfg(feature = "napi")]
pub use scan::scan_and_emit_modules;
#[allow(unused_imports)]
pub use scan::scan_typescript_bundle;
pub(crate) use scanner::resolve_external_import_path;

//! Virtual module postprocessing for `@reference-ui/core`.
//!
//! This module owns Rust-native transforms that normalize imports in generated
//! virtual files before the rest of the toolchain consumes them.

mod constants;
mod css;
mod cva;
mod utils;

#[cfg(test)]
mod tests;

#[cfg(any(test, feature = "napi"))]
pub use css::rewrite_css_imports;
#[cfg(any(test, feature = "napi"))]
pub use cva::rewrite_cva_imports;

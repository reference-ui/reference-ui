//! Virtual module postprocessing for `@reference-ui/core`.
//!
//! This module owns Rust-native transforms that normalize imports in generated
//! virtual files before the rest of the toolchain consumes them.

mod constants;
mod css;
mod cva;
mod replace_function_name;
mod responsive;
mod utils;

#[cfg(test)]
mod tests;

pub use css::rewrite_css_imports;
pub use cva::rewrite_cva_imports;
pub use replace_function_name::replace_function_name;
pub use responsive::apply_responsive_styles;

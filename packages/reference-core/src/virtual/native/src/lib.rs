#![deny(clippy::all)]

mod rewrite;

pub use rewrite::{rewrite_css_imports, rewrite_cva_imports};

//! Rust source file for Reference UI module.
//! Responsible for domain logic, AST parsing, or utility functions.
//! See module README for architecture details.

mod leading;
mod parse;

pub(super) use leading::leading_comment_for_span;
pub(super) use parse::parse_comment_metadata;

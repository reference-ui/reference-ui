//! Rust source file for Reference UI module.
//! Responsible for domain logic, AST parsing, or utility functions.
//! See module README for architecture details.

mod accessors;
mod dispatch;
mod signatures;

pub(super) use dispatch::{members_from_signatures, members_from_signatures_in};

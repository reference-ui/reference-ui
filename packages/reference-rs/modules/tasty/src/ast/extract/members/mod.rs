//! Rust source file for Reference UI module.
//! Responsible for domain logic, AST parsing, or utility functions.
//! See module README for architecture details.

mod dispatch;
mod signatures;

pub(super) use dispatch::members_from_signatures;

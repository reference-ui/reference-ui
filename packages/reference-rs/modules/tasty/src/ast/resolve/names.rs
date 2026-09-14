//! Rust source file for Reference UI module.
//! Responsible for domain logic, AST parsing, or utility functions.
//! See module README for architecture details.

pub(super) fn namespace_export_lookup_name(reference_name: &str) -> Option<&str> {
    let after_dot = reference_name.split_once('.')?.1;
    after_dot.split(['.', '<']).next()
}

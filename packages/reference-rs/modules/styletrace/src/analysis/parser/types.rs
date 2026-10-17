//! Groups the parser's prop-type work: deriving component prop bindings and resolving TypeScript prop types.
//! The two halves live in `types/bindings.rs` and `types/resolve.rs`; this file re-exports the entry points that sibling parser modules call.
//! It also owns `unwrap_transparent_expression`, the wrapper peel that the parser's expression matchers share.

mod bindings;
mod resolve;

use crate::analysis::util::transparent_inner;
use oxc_ast::ast::Expression;

pub use bindings::parse_prop_bindings;
pub use resolve::{wrapper_props_from_call, wrapper_props_from_type_arguments};

pub(super) fn unwrap_transparent_expression<'a>(
    expression: &'a Expression<'a>,
) -> &'a Expression<'a> {
    match transparent_inner(expression) {
        Some(inner) => unwrap_transparent_expression(inner),
        None => expression,
    }
}

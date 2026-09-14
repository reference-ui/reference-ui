//! Rust source file for Reference UI module.
//! Responsible for domain logic, AST parsing, or utility functions.
//! See module README for architecture details.

use oxc_span::Span;

pub(crate) fn slice_span(source: &str, span: Span) -> &str {
    &source[span.start as usize..span.end as usize]
}

//! Small shared extract helpers.
//! Slices source text for a span so Raw summaries and identifiers carry exact source slices.

use oxc_span::Span;

pub(crate) fn slice_span(source: &str, span: Span) -> &str {
    &source[span.start as usize..span.end as usize]
}

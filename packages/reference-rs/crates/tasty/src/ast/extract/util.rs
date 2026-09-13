use oxc_span::Span;

pub(crate) fn slice_span(source: &str, span: Span) -> &str {
    &source[span.start as usize..span.end as usize]
}

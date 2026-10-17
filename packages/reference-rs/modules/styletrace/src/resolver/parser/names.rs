//! Text helpers shared by the resolver's module and type parsers: source slices, quote stripping and
//! the names that property keys and import or export specifiers carry.
//! It takes oxc spans, keys and specifier names over one module's source text, and emits owned names.
//! Slices are bounds-checked, so a span outside the text yields an empty name rather than a panic.

use oxc_ast::ast::{ModuleExportName, PropertyKey};
use oxc_span::GetSpan;

pub(super) fn property_name(key: &PropertyKey<'_>, source: &str) -> Option<String> {
    Some(unquote(slice_span(source, key.span())))
}

pub(super) fn module_export_name(source: &str, imported: &ModuleExportName<'_>) -> String {
    unquote(slice_span(source, imported.span()))
}

pub(super) fn slice_span(source: &str, span: oxc_span::Span) -> &str {
    let start = span.start as usize;
    let end = span.end as usize;
    source.get(start..end).unwrap_or_default()
}

pub(super) fn string_from_span(source: &str, span: oxc_span::Span) -> String {
    slice_span(source, span).to_string()
}

pub(super) fn unquote(value: &str) -> String {
    value
        .trim()
        .trim_matches('"')
        .trim_matches('\'')
        .to_string()
}

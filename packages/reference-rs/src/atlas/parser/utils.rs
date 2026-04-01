use oxc_ast::ast::{ModuleExportName, PropertyKey};
use oxc_span::{GetSpan, Span};
use std::path::Path;

pub(super) fn module_export_name_to_string(name: &ModuleExportName<'_>) -> String {
    match name {
        ModuleExportName::IdentifierName(identifier) => identifier.name.to_string(),
        ModuleExportName::IdentifierReference(identifier) => identifier.name.to_string(),
        ModuleExportName::StringLiteral(string) => unquote(string.value.as_str()),
    }
}

pub(super) fn default_export_name(path: &Path) -> String {
    let stem = path
        .file_stem()
        .and_then(|value| value.to_str())
        .unwrap_or("DefaultComponent");
    let mut chars = stem.chars();
    match chars.next() {
        Some(first) if first.is_ascii_uppercase() => stem.to_string(),
        Some(first) => format!("{}{}", first.to_ascii_uppercase(), chars.as_str()),
        None => "DefaultComponent".to_string(),
    }
}

pub(super) fn reference_name(raw: &str) -> String {
    raw.split('<').next().unwrap_or(raw).trim().to_string()
}

pub(super) fn slice_span(source: &str, span: Span) -> &str {
    &source[span.start as usize..span.end as usize]
}

pub(super) fn unquote(value: &str) -> String {
    strip_wrapped_quotes(value).unwrap_or(value).to_string()
}

pub(super) fn strip_wrapped_quotes(value: &str) -> Option<&str> {
    let trimmed = value.trim();
    if trimmed.len() >= 2
        && ((trimmed.starts_with('"') && trimmed.ends_with('"'))
            || (trimmed.starts_with('\'') && trimmed.ends_with('\''))
            || (trimmed.starts_with('`') && trimmed.ends_with('`')))
    {
        Some(&trimmed[1..trimmed.len() - 1])
    } else {
        None
    }
}

pub(super) fn property_key_name(property_key: &PropertyKey<'_>, source: &str) -> Option<String> {
    match property_key {
        PropertyKey::StaticIdentifier(identifier) => Some(identifier.name.to_string()),
        PropertyKey::StringLiteral(_) => Some(unquote(slice_span(source, property_key.span()))),
        PropertyKey::NumericLiteral(_) => Some(slice_span(source, property_key.span()).to_string()),
        _ => None,
    }
}

pub(crate) fn local_source_display(root: &Path, file_path: &Path) -> String {
    if let Ok(relative) = file_path.strip_prefix(root.join("src")) {
        return format!("./{}", path_to_posix(relative));
    }
    if let Ok(relative) = file_path.strip_prefix(root) {
        return format!("./{}", path_to_posix(relative));
    }
    file_path.to_string_lossy().replace('\\', "/")
}

pub(crate) fn path_to_posix(path: &Path) -> String {
    path.to_string_lossy().replace('\\', "/")
}
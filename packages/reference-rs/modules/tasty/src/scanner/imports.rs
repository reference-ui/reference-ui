//! Module specifier discovery.
//! Extracts the import and export module specifiers of a screened file so the crawler can follow them, and the re-export
//! subset of them, from one parse. Syntax-level only; it never resolves. A file the nesting gate refused yields no specifiers.

use std::collections::BTreeSet;

use oxc_allocator::Allocator;
use oxc_ast::ast::Statement;
use oxc_span::{SourceType, Span};
use shared::parse::{parse_screened, ScreenedSource};

/// What one parse of a file yields for the crawler: every followed specifier, and the subset that appears in re-exports.
#[derive(Debug, Default)]
pub(super) struct ModuleSpecifiers {
    /// Imports and exports with a source, in source order.
    pub(super) all: Vec<String>,
    /// Specifiers that appear in re-exports only: `export ... from 'module'`.
    /// They decide which followed libraries bridge into the name index (only
    /// user re-exports bridge; scoped plain imports are followed without indexing).
    pub(super) reexports: BTreeSet<String>,
}

/// The source type both the crawl and the extraction parse a file with.
pub(crate) fn source_type_of(file_id: &str) -> SourceType {
    SourceType::from_path(file_id).unwrap_or_default()
}

const IGNORED_ASSET_EXTENSIONS: [&str; 6] = [".css", ".scss", ".sass", ".less", ".pcss", ".styl"];

/// Both specifier lists from one parse of `source`. A file the nesting gate refused yields none; extract_file reports the
/// refusal once.
pub(super) fn module_specifiers_of(source: &ScreenedSource) -> ModuleSpecifiers {
    let allocator = Allocator::default();
    let Ok(parsed) = parse_screened(&allocator, source) else {
        return ModuleSpecifiers::default();
    };
    let mut specifiers = ModuleSpecifiers::default();

    for statement in &parsed.program.body {
        let Some((module_specifier, is_reexport)) = module_specifier_from_statement(statement, source)
        else {
            continue;
        };
        let module_specifier = normalize_module_specifier(module_specifier);
        if !should_follow_module_specifier(&module_specifier) {
            continue;
        }
        if is_reexport {
            specifiers.reexports.insert(module_specifier.clone());
        }
        specifiers.all.push(module_specifier);
    }

    specifiers
}

fn should_follow_module_specifier(module_specifier: &str) -> bool {
    !IGNORED_ASSET_EXTENSIONS
        .iter()
        .any(|extension| module_specifier.ends_with(extension))
}

/// The statement's source specifier, and whether the statement is a re-export.
fn module_specifier_from_statement(
    statement: &Statement<'_>,
    source: &str,
) -> Option<(String, bool)> {
    match statement {
        Statement::ImportDeclaration(import) => {
            Some((slice_span(source, import.source.span).to_string(), false))
        }
        Statement::ExportAllDeclaration(export) => {
            Some((slice_span(source, export.source.span).to_string(), true))
        }
        Statement::ExportNamedDeclaration(export) => export
            .source
            .as_ref()
            .map(|source_module| (slice_span(source, source_module.span).to_string(), true)),
        _ => None,
    }
}

fn normalize_module_specifier(value: String) -> String {
    value.trim_matches('"').trim_matches('\'').to_string()
}

fn slice_span(source: &str, span: Span) -> &str {
    &source[span.start as usize..span.end as usize]
}

/// Every followed specifier of `source`, screened and parsed once. Tests only: the crawler holds its own screened source.
#[cfg(test)]
pub(crate) fn extract_module_specifiers(file_id: &str, source: &str) -> Vec<String> {
    let screened = ScreenedSource::screen(source.to_string(), source_type_of(file_id));
    module_specifiers_of(&screened).all
}

#[cfg(test)]
mod tests {
    use super::extract_module_specifiers;

    #[test]
    fn extract_module_specifiers_ignores_stylesheet_imports() {
        let source = r#"
import './styles.css'
import type { ButtonProps } from '@reference-ui/react'
import tokens from './tokens.scss'
export { Box } from './box'
"#;

        let module_specifiers = extract_module_specifiers("src/index.ts", source);

        assert_eq!(
            module_specifiers,
            vec!["@reference-ui/react".to_string(), "./box".to_string()]
        );
    }
}

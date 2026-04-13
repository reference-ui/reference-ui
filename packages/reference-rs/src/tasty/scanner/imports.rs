use oxc_allocator::Allocator;
use oxc_ast::ast::Statement;
use oxc_parser::Parser;
use oxc_span::{SourceType, Span};

pub(crate) fn extract_module_specifiers(file_id: &str, source: &str) -> Vec<String> {
    extract_module_specifiers_with(file_id, source, true)
}

/// Module specifiers that appear in re-exports only: `export ... from 'module'`.
/// Used to decide when we follow external imports (only if the user re-exports that module).
pub(super) fn extract_reexport_module_specifiers(file_id: &str, source: &str) -> Vec<String> {
    extract_module_specifiers_with(file_id, source, false)
}

const IGNORED_ASSET_EXTENSIONS: [&str; 6] = [".css", ".scss", ".sass", ".less", ".pcss", ".styl"];

fn extract_module_specifiers_with(
    file_id: &str,
    source: &str,
    include_imports: bool,
) -> Vec<String> {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(file_id).unwrap_or_default();
    let program = Parser::new(&allocator, source, source_type).parse().program;
    let mut module_specifiers = Vec::new();

    for statement in &program.body {
        if let Some(module_specifier) =
            module_specifier_from_statement(statement, source, include_imports)
        {
            module_specifiers.push(module_specifier);
        }
    }

    module_specifiers
        .into_iter()
        .map(normalize_module_specifier)
        .filter(|module_specifier| should_follow_module_specifier(module_specifier))
        .collect()
}

fn should_follow_module_specifier(module_specifier: &str) -> bool {
    !IGNORED_ASSET_EXTENSIONS
        .iter()
        .any(|extension| module_specifier.ends_with(extension))
}

fn module_specifier_from_statement(
    statement: &Statement<'_>,
    source: &str,
    include_imports: bool,
) -> Option<String> {
    match statement {
        Statement::ImportDeclaration(import) if include_imports => {
            Some(slice_span(source, import.source.span).to_string())
        }
        Statement::ExportAllDeclaration(export) => {
            Some(slice_span(source, export.source.span).to_string())
        }
        Statement::ExportNamedDeclaration(export) => export
            .source
            .as_ref()
            .map(|source_module| slice_span(source, source_module.span).to_string()),
        _ => None,
    }
}

fn normalize_module_specifier(value: String) -> String {
    value.trim_matches('"').trim_matches('\'').to_string()
}

fn slice_span(source: &str, span: Span) -> &str {
    &source[span.start as usize..span.end as usize]
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

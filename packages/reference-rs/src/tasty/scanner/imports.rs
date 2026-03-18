use oxc_allocator::Allocator;
use oxc_ast::ast::Statement;
use oxc_parser::Parser;
use oxc_span::{SourceType, Span};

pub(super) fn extract_module_specifiers(file_id: &str, source: &str) -> Vec<String> {
    extract_module_specifiers_with(file_id, source, true)
}

/// Module specifiers that appear in re-exports only: `export ... from 'module'`.
/// Used to decide when we follow external imports (only if the user re-exports that module).
pub(super) fn extract_reexport_module_specifiers(file_id: &str, source: &str) -> Vec<String> {
    extract_module_specifiers_with(file_id, source, false)
}

fn extract_module_specifiers_with(
    file_id: &str,
    source: &str,
    include_imports: bool,
) -> Vec<String> {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(file_id).unwrap_or_default();
    let parse_result = Parser::new(&allocator, source, source_type).parse();
    let mut modules = Vec::new();

    for statement in parse_result.program.body.iter() {
        if let Some(module) = module_specifier_from_statement(statement, source, include_imports) {
            modules.push(module);
        }
    }

    modules
        .into_iter()
        .map(normalize_module_specifier)
        .collect()
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

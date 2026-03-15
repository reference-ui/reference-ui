use oxc_allocator::Allocator;
use oxc_ast::ast::Statement;
use oxc_parser::Parser;
use oxc_span::{SourceType, Span};

pub(super) fn extract_module_specifiers(file_id: &str, source: &str) -> Vec<String> {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(file_id).unwrap_or_default();
    let parse_result = Parser::new(&allocator, source, source_type).parse();
    let mut modules = Vec::new();

    for statement in parse_result.program.body.iter() {
        match statement {
            Statement::ImportDeclaration(import) => {
                modules.push(slice_span(source, import.source.span).to_string());
            }
            Statement::ExportAllDeclaration(export) => {
                modules.push(slice_span(source, export.source.span).to_string());
            }
            Statement::ExportNamedDeclaration(export) => {
                if let Some(source_module) = &export.source {
                    modules.push(slice_span(source, source_module.span).to_string());
                }
            }
            _ => {}
        }
    }

    modules
        .into_iter()
        .map(|value| value.trim_matches('"').trim_matches('\'').to_string())
        .collect()
}

/// Module specifiers that appear in re-exports only: `export ... from 'module'`.
/// Used to decide when we follow external imports (only if the user re-exports that module).
pub(super) fn extract_reexport_module_specifiers(file_id: &str, source: &str) -> Vec<String> {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(file_id).unwrap_or_default();
    let parse_result = Parser::new(&allocator, source, source_type).parse();
    let mut modules = Vec::new();

    for statement in parse_result.program.body.iter() {
        match statement {
            Statement::ExportAllDeclaration(export) => {
                modules.push(slice_span(source, export.source.span).to_string());
            }
            Statement::ExportNamedDeclaration(export) => {
                if let Some(source_module) = &export.source {
                    modules.push(slice_span(source, source_module.span).to_string());
                }
            }
            _ => {}
        }
    }

    modules
        .into_iter()
        .map(|value| value.trim_matches('"').trim_matches('\'').to_string())
        .collect()
}

fn slice_span(source: &str, span: Span) -> &str {
    &source[span.start as usize..span.end as usize]
}

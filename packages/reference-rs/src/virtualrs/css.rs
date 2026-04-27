use oxc_allocator::Allocator;
use oxc_ast::ast::Statement;
use oxc_parser::Parser;
use oxc_span::SourceType;

use super::constants::CSS_BINDING;
use super::utils::{
    apply_rewrite, collect_import_parts, is_core_runtime_import, render_named_import,
    render_rewritten_imports, ImportCollection, RewritePlan,
};

pub fn rewrite_css_imports(source_code: &str, relative_path: &str) -> String {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(relative_path).unwrap_or_default();
    let parse_result = Parser::new(&allocator, source_code, source_type).parse();

    for statement in parse_result.program.body.iter() {
        let Statement::ImportDeclaration(import) = statement else {
            continue;
        };

        if !is_core_runtime_import(source_code, import) {
            continue;
        }

        let Some(import_parts) = collect_import_parts(source_code, import, |imported, local| {
            if imported == CSS_BINDING {
                ImportCollection::Matched {
                    local_binding_to_normalize: Some(local.to_string()),
                }
            } else {
                ImportCollection::Keep {
                    part: render_named_import(imported, local),
                }
            }
        }) else {
            continue;
        };

        return apply_rewrite(
            source_code,
            RewritePlan {
                start: import.span.start as usize,
                end: import.span.end as usize,
                replacement: render_rewritten_imports(
                    CSS_BINDING,
                    &import_parts.default_name,
                    &import_parts.remaining_parts,
                ),
                local_binding_to_normalize: import_parts
                    .local_binding_to_normalize
                    .filter(|local| local != CSS_BINDING),
                canonical_call_name: Some(CSS_BINDING),
            },
        );
    }

    source_code.to_string()
}

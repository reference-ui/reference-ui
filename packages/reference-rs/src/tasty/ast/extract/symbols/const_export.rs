use oxc_ast::ast::{BindingPattern, VariableDeclarationKind};
use oxc_span::Span;

use super::super::comments::{leading_comment_for_span, parse_comment_metadata};
use super::super::values::infer_initializer_value_type;
use super::super::ExtractionContext;
use crate::tasty::ast::model::SymbolShell;
use crate::tasty::model::TsSymbolKind;
use crate::tasty::scanner::symbol_id;

pub(crate) fn push_const_export_shell<'a>(
    file_id: &str,
    ctx: &ExtractionContext<'_>,
    declaration: &oxc_allocator::Box<'a, oxc_ast::ast::VariableDeclaration<'a>>,
    comment_span: Span,
    exported: bool,
    exports: &mut Vec<SymbolShell>,
) {
    if declaration.kind != VariableDeclarationKind::Const {
        return;
    }

    for declarator in declaration.declarations.iter() {
        let BindingPattern::BindingIdentifier(identifier) = &declarator.id else {
            continue;
        };
        let Some(init) = declarator.init.as_ref() else {
            continue;
        };
        let Some(underlying) = infer_initializer_value_type(init, ctx) else {
            continue;
        };

        let name = identifier.name.to_string();
        let id = symbol_id(file_id, &name);
        let comment = parse_comment_metadata(leading_comment_for_span(
            ctx.source,
            ctx.comments,
            comment_span,
            None,
        ));

        exports.push(SymbolShell {
            id,
            name,
            kind: TsSymbolKind::TypeAlias,
            exported,
            description: comment.description,
            description_raw: comment.description_raw,
            jsdoc: comment.jsdoc,
            type_parameters: Vec::new(),
            defined_members: Vec::new(),
            extends: Vec::new(),
            underlying: Some(underlying),
            references: Vec::new(),
        });
    }
}

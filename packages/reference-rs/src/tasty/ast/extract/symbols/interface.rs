use oxc_ast::ast::TSInterfaceDeclaration;
use oxc_span::{GetSpan, Span};

use super::super::comments::{leading_comment_for_span, parse_comment_metadata};
use super::super::members::members_from_signatures;
use super::super::type_references::collect_references_from_members;
use super::super::types::{expression_to_reference, type_parameters_from_oxc};
use super::super::ExtractionContext;
use crate::tasty::ast::model::SymbolShell;
use crate::tasty::model::TsSymbolKind;
use crate::tasty::scanner::symbol_id;

pub(crate) fn push_interface_shell<'a>(
    file_id: &str,
    ctx: &ExtractionContext<'_>,
    interface_decl: &TSInterfaceDeclaration<'a>,
    comment_span: Span,
    exported: bool,
    exports: &mut Vec<SymbolShell>,
) {
    let name = interface_decl.id.name.to_string();
    let id = symbol_id(file_id, &name);
    let comment = parse_comment_metadata(leading_comment_for_span(
        ctx.source,
        ctx.comments,
        comment_span,
        None,
    ));
    let defined_members = members_from_signatures(
        interface_decl.body.body.as_slice(),
        ctx,
        Some(interface_decl.span().start),
    );

    let extends = interface_decl
        .extends
        .iter()
        .map(|heritage| expression_to_reference(&heritage.expression, ctx))
        .collect::<Vec<_>>();

    let type_parameters =
        type_parameters_from_oxc(interface_decl.type_parameters.as_deref(), ctx);

    let references =
        collect_references_from_members(&defined_members, &extends, None, &type_parameters);

    exports.push(SymbolShell {
        id,
        name,
        kind: TsSymbolKind::Interface,
        exported,
        description: comment.description,
        description_raw: comment.description_raw,
        jsdoc: comment.jsdoc,
        type_parameters,
        defined_members,
        extends,
        underlying: None,
        references,
    });
}

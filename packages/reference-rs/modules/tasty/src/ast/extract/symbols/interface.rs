//! Rust source file for Reference UI module.
//! Responsible for domain logic, AST parsing, or utility functions.
//! See module README for architecture details.

use oxc_ast::ast::TSInterfaceDeclaration;
use oxc_span::{GetSpan, Span};

use super::super::comments::{leading_comment_for_span, parse_comment_metadata};
use super::super::members::members_from_signatures;
use super::super::type_references::collect_references_from_members;
use super::super::types::{interface_heritage_to_reference, type_parameters_from_oxc};
use super::super::ShellSink;
use crate::ast::model::SymbolShell;
use crate::model::TsSymbolKind;
use crate::scanner::symbol_id;

pub(crate) fn push_interface_shell<'a>(
    sink: &mut ShellSink<'_, '_>,
    interface_decl: &TSInterfaceDeclaration<'a>,
    comment_span: Span,
    exported: bool,
) {
    let ctx = sink.ctx;
    let name = interface_decl.id.name.to_string();
    let id = symbol_id(sink.file_id, &name);
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
        .map(|heritage| interface_heritage_to_reference(heritage, ctx))
        .collect::<Vec<_>>();

    let type_parameters = type_parameters_from_oxc(interface_decl.type_parameters.as_deref(), ctx);

    let references =
        collect_references_from_members(&defined_members, &extends, None, &type_parameters);

    sink.exports.push(SymbolShell {
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

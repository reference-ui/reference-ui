use std::collections::BTreeMap;

use oxc_ast::ast::{Comment, TSInterfaceDeclaration, TSTypeAliasDeclaration};
use oxc_span::{GetSpan, Span};

use crate::tasty::ast::model::{ImportBinding, SymbolShell};
use crate::tasty::model::TsSymbolKind;
use crate::tasty::scanner::symbol_id;
use super::comments::{leading_comment_for_span, parse_comment_metadata};
use super::members::members_from_signatures;
use super::type_references::collect_references_from_members;
use super::types::{expression_to_reference, type_parameters_from_oxc, type_to_ref};

pub(super) fn push_interface_shell<'a>(
    file_id: &str,
    current_module_specifier: &str,
    current_library: &str,
    interface_decl: &TSInterfaceDeclaration<'a>,
    comment_span: Span,
    source: &str,
    comments: &[Comment],
    import_bindings: &BTreeMap<String, ImportBinding>,
    exported: bool,
    exports: &mut Vec<SymbolShell>,
) {
    let name = interface_decl.id.name.to_string();
    let id = symbol_id(file_id, &name);
    let comment = parse_comment_metadata(leading_comment_for_span(
        source,
        comments,
        comment_span,
        None,
    ));
    let defined_members = members_from_signatures(
        interface_decl.body.body.as_slice(),
        source,
        comments,
        Some(interface_decl.span().start),
        import_bindings,
        current_module_specifier,
        current_library,
    );

    let extends = interface_decl
        .extends
        .iter()
        .map(|heritage| {
            expression_to_reference(
                &heritage.expression,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            )
        })
        .collect::<Vec<_>>();

    let type_parameters = type_parameters_from_oxc(
        interface_decl.type_parameters.as_deref(),
        source,
        import_bindings,
        current_module_specifier,
        current_library,
    );

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

pub(super) fn push_type_alias_shell<'a>(
    file_id: &str,
    current_module_specifier: &str,
    current_library: &str,
    type_alias: &TSTypeAliasDeclaration<'a>,
    comment_span: Span,
    source: &str,
    comments: &[Comment],
    import_bindings: &BTreeMap<String, ImportBinding>,
    exported: bool,
    exports: &mut Vec<SymbolShell>,
) {
    let name = type_alias.id.name.to_string();
    let id = symbol_id(file_id, &name);
    let comment = parse_comment_metadata(leading_comment_for_span(
        source,
        comments,
        comment_span,
        None,
    ));
    let type_parameters = type_parameters_from_oxc(
        type_alias.type_parameters.as_deref(),
        source,
        import_bindings,
        current_module_specifier,
        current_library,
    );

    let underlying = Some(type_to_ref(
        &type_alias.type_annotation,
        source,
        import_bindings,
        current_module_specifier,
        current_library,
    ));
    let references =
        collect_references_from_members(&[], &[], underlying.as_ref(), &type_parameters);

    exports.push(SymbolShell {
        id,
        name,
        kind: TsSymbolKind::TypeAlias,
        exported,
        description: comment.description,
        description_raw: comment.description_raw,
        jsdoc: comment.jsdoc,
        type_parameters,
        defined_members: Vec::new(),
        extends: Vec::new(),
        underlying,
        references,
    });
}

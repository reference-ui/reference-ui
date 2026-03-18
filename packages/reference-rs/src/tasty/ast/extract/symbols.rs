use std::collections::BTreeMap;

use oxc_ast::ast::{Comment, TSSignature, TSInterfaceDeclaration, TSTypeAliasDeclaration};
use oxc_span::GetSpan;

use super::comments::{leading_comment_for_span, parse_comment_metadata};
use super::lowering::{
    call_signature_to_member, collect_references_from_members, construct_signature_to_member,
    expression_to_reference, index_signature_to_member, method_signature_to_member,
    property_signature_to_member, type_parameters_from_oxc, type_to_ref,
};
use super::super::super::model::{TsSymbolKind};
use super::super::super::scanner::symbol_id;
use super::super::model::{ImportBinding, SymbolShell};

pub(super) fn push_interface_shell<'a>(
    file_id: &str,
    current_module_specifier: &str,
    current_library: &str,
    interface_decl: &TSInterfaceDeclaration<'a>,
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
        interface_decl.span(),
        None,
    ));
    let interface_start = interface_decl.span().start;
    let all_member_starts: Vec<u32> = interface_decl
        .body
        .body
        .iter()
        .map(|sig| sig.span().start)
        .collect();
    let defined_members = interface_decl
        .body
        .body
        .iter()
        .filter_map(|signature| {
            let start = signature.span().start;
            let others: Vec<u32> = std::iter::once(interface_start)
                .chain(all_member_starts.iter().copied().filter(|&s| s != start))
                .collect();
            let exclude = if others.is_empty() {
                None
            } else {
                Some(others.as_slice())
            };
            match signature {
                TSSignature::TSPropertySignature(property) => Some(property_signature_to_member(
                    property,
                    source,
                    comments,
                    exclude,
                    import_bindings,
                    current_module_specifier,
                    current_library,
                )),
                TSSignature::TSMethodSignature(method) => Some(method_signature_to_member(
                    method,
                    source,
                    comments,
                    exclude,
                    import_bindings,
                    current_module_specifier,
                    current_library,
                )),
                TSSignature::TSCallSignatureDeclaration(call) => Some(call_signature_to_member(
                    call,
                    source,
                    comments,
                    exclude,
                    import_bindings,
                    current_module_specifier,
                    current_library,
                )),
                TSSignature::TSIndexSignature(index) => Some(index_signature_to_member(
                    index,
                    source,
                    comments,
                    exclude,
                    import_bindings,
                    current_module_specifier,
                    current_library,
                )),
                TSSignature::TSConstructSignatureDeclaration(decl) => Some(
                    construct_signature_to_member(
                        decl,
                        source,
                        comments,
                        exclude,
                        import_bindings,
                        current_module_specifier,
                        current_library,
                    ),
                ),
            }
        })
        .collect::<Vec<_>>();

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
        comments,
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
        type_alias.span(),
        None,
    ));
    let type_parameters = type_parameters_from_oxc(
        type_alias.type_parameters.as_deref(),
        source,
        comments,
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

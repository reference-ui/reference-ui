use std::collections::BTreeMap;

use oxc_ast::ast::{Comment, TSTypeAliasDeclaration};
use oxc_span::Span;

use super::super::comments::{leading_comment_for_span, parse_comment_metadata};
use super::super::type_references::collect_references_from_members;
use super::super::types::{type_parameters_from_oxc, type_to_ref};
use crate::tasty::ast::model::{ImportBinding, SymbolShell};
use crate::tasty::model::TsSymbolKind;
use crate::tasty::scanner::symbol_id;

pub(crate) fn push_type_alias_shell<'a>(
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

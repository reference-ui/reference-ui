use std::collections::BTreeMap;

use oxc_ast::ast::{
    Comment, PropertyKey, TSCallSignatureDeclaration, TSConstructSignatureDeclaration,
    TSIndexSignature, TSMethodSignature, TSPropertySignature, TSSignature,
};
use oxc_span::GetSpan;

use super::super::super::model::{TsMember, TsMemberKind};
use super::super::model::ImportBinding;
use super::comments::{leading_comment_for_span, parse_comment_metadata};
use super::slice_span;
use super::types::type_to_ref;

pub(super) fn members_from_signatures(
    signatures: &[TSSignature<'_>],
    source: &str,
    comments: &[Comment],
    container_start: Option<u32>,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> Vec<TsMember> {
    let all_member_starts: Vec<u32> = signatures
        .iter()
        .map(|signature| signature.span().start)
        .collect();

    signatures
        .iter()
        .map(|signature| {
            let exclude = member_exclusion_starts(signature, &all_member_starts, container_start);

            match signature {
                TSSignature::TSPropertySignature(property) => property_signature_to_member(
                    property,
                    source,
                    comments,
                    exclude.as_deref(),
                    import_bindings,
                    current_module_specifier,
                    current_library,
                ),
                TSSignature::TSMethodSignature(method) => method_signature_to_member(
                    method,
                    source,
                    comments,
                    exclude.as_deref(),
                    import_bindings,
                    current_module_specifier,
                    current_library,
                ),
                TSSignature::TSCallSignatureDeclaration(call) => call_signature_to_member(
                    call,
                    source,
                    comments,
                    exclude.as_deref(),
                    import_bindings,
                    current_module_specifier,
                    current_library,
                ),
                TSSignature::TSIndexSignature(index) => index_signature_to_member(
                    index,
                    source,
                    comments,
                    exclude.as_deref(),
                    import_bindings,
                    current_module_specifier,
                    current_library,
                ),
                TSSignature::TSConstructSignatureDeclaration(decl) => {
                    construct_signature_to_member(
                        decl,
                        source,
                        comments,
                        exclude.as_deref(),
                        import_bindings,
                        current_module_specifier,
                        current_library,
                    )
                }
            }
        })
        .collect()
}

pub(super) fn property_signature_to_member(
    property: &TSPropertySignature<'_>,
    source: &str,
    comments: &[Comment],
    exclude_starts_between: Option<&[u32]>,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> TsMember {
    let name = property_key_name(&property.key, source);
    let comment = parse_comment_metadata(leading_comment_for_span(
        source,
        comments,
        property.span(),
        exclude_starts_between,
    ));
    let type_ref = property.type_annotation.as_ref().map(|annotation| {
        type_to_ref(
            &annotation.type_annotation,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
        )
    });

    TsMember {
        name,
        optional: property.optional,
        readonly: property.readonly,
        kind: TsMemberKind::Property,
        description: comment.description,
        description_raw: comment.description_raw,
        jsdoc: comment.jsdoc,
        type_ref,
    }
}

pub(super) fn method_signature_to_member(
    method: &TSMethodSignature<'_>,
    source: &str,
    comments: &[Comment],
    exclude_starts_between: Option<&[u32]>,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> TsMember {
    let name = property_key_name(&method.key, source);
    let comment = parse_comment_metadata(leading_comment_for_span(
        source,
        comments,
        method.span(),
        exclude_starts_between,
    ));
    let type_ref = method.return_type.as_ref().map(|annotation| {
        type_to_ref(
            &annotation.type_annotation,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
        )
    });

    TsMember {
        name,
        optional: method.optional,
        readonly: false,
        kind: TsMemberKind::Method,
        description: comment.description,
        description_raw: comment.description_raw,
        jsdoc: comment.jsdoc,
        type_ref,
    }
}

pub(super) fn call_signature_to_member(
    call: &TSCallSignatureDeclaration<'_>,
    source: &str,
    comments: &[Comment],
    exclude_starts_between: Option<&[u32]>,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> TsMember {
    let comment = parse_comment_metadata(leading_comment_for_span(
        source,
        comments,
        call.span(),
        exclude_starts_between,
    ));
    let type_ref = call.return_type.as_ref().map(|annotation| {
        type_to_ref(
            &annotation.type_annotation,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
        )
    });

    TsMember {
        name: "[call]".to_string(),
        optional: false,
        readonly: false,
        kind: TsMemberKind::CallSignature,
        description: comment.description,
        description_raw: comment.description_raw,
        jsdoc: comment.jsdoc,
        type_ref,
    }
}

pub(super) fn construct_signature_to_member(
    decl: &TSConstructSignatureDeclaration<'_>,
    source: &str,
    comments: &[Comment],
    exclude_starts_between: Option<&[u32]>,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> TsMember {
    let comment = parse_comment_metadata(leading_comment_for_span(
        source,
        comments,
        decl.span(),
        exclude_starts_between,
    ));
    let type_ref = decl.return_type.as_ref().map(|annotation| {
        type_to_ref(
            &annotation.type_annotation,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
        )
    });

    TsMember {
        name: "[new]".to_string(),
        optional: false,
        readonly: false,
        kind: TsMemberKind::ConstructSignature,
        description: comment.description,
        description_raw: comment.description_raw,
        jsdoc: comment.jsdoc,
        type_ref,
    }
}

pub(super) fn index_signature_to_member(
    index: &TSIndexSignature<'_>,
    source: &str,
    comments: &[Comment],
    exclude_starts_between: Option<&[u32]>,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> TsMember {
    let comment = parse_comment_metadata(leading_comment_for_span(
        source,
        comments,
        index.span(),
        exclude_starts_between,
    ));
    let type_ref = Some(type_to_ref(
        &index.type_annotation.type_annotation,
        source,
        import_bindings,
        current_module_specifier,
        current_library,
    ));

    TsMember {
        name: "[index]".to_string(),
        optional: false,
        readonly: index.readonly,
        kind: TsMemberKind::IndexSignature,
        description: comment.description,
        description_raw: comment.description_raw,
        jsdoc: comment.jsdoc,
        type_ref,
    }
}

fn member_exclusion_starts(
    current_signature: &TSSignature<'_>,
    all_member_starts: &[u32],
    container_start: Option<u32>,
) -> Option<Vec<u32>> {
    let current_start = current_signature.span().start;
    let mut exclude: Vec<u32> = all_member_starts
        .iter()
        .copied()
        .filter(|&start| start != current_start)
        .collect();

    if let Some(container_start) = container_start {
        exclude.insert(0, container_start);
    }

    (!exclude.is_empty()).then_some(exclude)
}

fn property_key_name(key: &PropertyKey<'_>, source: &str) -> String {
    slice_span(source, key.span()).to_string()
}

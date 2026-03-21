use std::collections::BTreeMap;

use oxc_ast::ast::{Comment, TSSignature};
use oxc_span::GetSpan;

use super::signatures::{
    call_signature_to_member, construct_signature_to_member, index_signature_to_member,
    method_signature_to_member, property_signature_to_member,
};
use crate::tasty::ast::model::ImportBinding;
use crate::tasty::model::TsMember;

pub(crate) fn members_from_signatures(
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

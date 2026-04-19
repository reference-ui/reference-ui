use oxc_ast::ast::TSSignature;
use oxc_span::GetSpan;

use super::super::ExtractionContext;
use super::signatures::{
    call_signature_to_member, construct_signature_to_member, index_signature_to_member,
    method_signature_to_member, property_signature_to_member,
};
use crate::tasty::model::TsMember;

pub(crate) fn members_from_signatures(
    signatures: &[TSSignature<'_>],
    ctx: &ExtractionContext<'_>,
    container_start: Option<u32>,
) -> Vec<TsMember> {
    let starts = signature_start_positions(signatures);

    signatures
        .iter()
        .map(|signature| {
            let exclude = member_exclusion_starts(signature, &starts, container_start);
            convert_signature(ctx, signature, exclude.as_deref())
        })
        .collect()
}

fn convert_signature(
    ctx: &ExtractionContext<'_>,
    signature: &TSSignature<'_>,
    exclude: Option<&[u32]>,
) -> TsMember {
    use TSSignature as Sig;

    match signature {
        Sig::TSPropertySignature(property) => property_signature_to_member(property, ctx, exclude),
        Sig::TSMethodSignature(method) => method_signature_to_member(method, ctx, exclude),
        Sig::TSCallSignatureDeclaration(call) => call_signature_to_member(call, ctx, exclude),
        Sig::TSIndexSignature(index) => index_signature_to_member(index, ctx, exclude),
        Sig::TSConstructSignatureDeclaration(decl) => {
            construct_signature_to_member(decl, ctx, exclude)
        }
    }
}

fn signature_start_positions(signatures: &[TSSignature<'_>]) -> Vec<u32> {
    signatures.iter().map(|s| s.span().start).collect()
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

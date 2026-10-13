//! Walks an interface or type-literal body and converts each `TSSignature` into a `TsMember`, in source order.
//! An accessor signature goes through `accessors.rs`, which joins a get and a set of one name into a single
//! property member. Every member type lowers with the enclosing binder names bound, and each signature's
//! leading comment is looked up with the other signatures' spans excluded, so comments stay with their signature.

use oxc_ast::ast::{TSMethodSignature, TSMethodSignatureKind, TSSignature};
use oxc_span::GetSpan;

use super::super::ExtractionContext;
use super::accessors::AccessorFold;
use super::signatures::{
    accessor_signature_to_member, call_signature_to_member, construct_signature_to_member,
    index_signature_to_member, method_signature_to_member, property_signature_to_member,
};
use crate::model::TsMember;

/// Members of a body whose enclosing scope binds no type-parameter names (an interface body).
pub(crate) fn members_from_signatures(
    signatures: &[TSSignature<'_>],
    ctx: &ExtractionContext<'_>,
    container_start: Option<u32>,
) -> Vec<TsMember> {
    members_from_signatures_in(signatures, ctx, container_start, &[])
}

/// Members of a body nested inside a binder: `binders` are bound for every member's type.
pub(crate) fn members_from_signatures_in(
    signatures: &[TSSignature<'_>],
    ctx: &ExtractionContext<'_>,
    container_start: Option<u32>,
    binders: &[String],
) -> Vec<TsMember> {
    let starts = signature_start_positions(signatures);
    let mut members = Vec::with_capacity(signatures.len());
    let mut accessors = AccessorFold::default();

    for signature in signatures {
        let exclude = member_exclusion_starts(signature, &starts, container_start);
        let exclude = exclude.as_deref();
        match signature {
            TSSignature::TSMethodSignature(method) if is_accessor(method) => {
                let accessor = accessor_signature_to_member(method, ctx, exclude, binders);
                accessors.push(&mut members, accessor);
            }
            _ => members.push(convert_signature(ctx, signature, exclude, binders)),
        }
    }

    members
}

fn is_accessor(method: &TSMethodSignature<'_>) -> bool {
    matches!(
        method.kind,
        TSMethodSignatureKind::Get | TSMethodSignatureKind::Set
    )
}

fn convert_signature(
    ctx: &ExtractionContext<'_>,
    signature: &TSSignature<'_>,
    exclude: Option<&[u32]>,
    binders: &[String],
) -> TsMember {
    use TSSignature as Sig;

    match signature {
        Sig::TSPropertySignature(property) => {
            property_signature_to_member(property, ctx, exclude, binders)
        }
        Sig::TSMethodSignature(method) => method_signature_to_member(method, ctx, exclude, binders),
        Sig::TSCallSignatureDeclaration(call) => {
            call_signature_to_member(call, ctx, exclude, binders)
        }
        Sig::TSIndexSignature(index) => index_signature_to_member(index, ctx, exclude, binders),
        Sig::TSConstructSignatureDeclaration(decl) => {
            construct_signature_to_member(decl, ctx, exclude, binders)
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

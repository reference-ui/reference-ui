use oxc_ast::ast::{
    TSCallSignatureDeclaration, TSConstructSignatureDeclaration, TSIndexSignature,
    TSMethodSignature, TSPropertySignature,
};
use oxc_span::GetSpan;

use crate::tasty::shared::type_ref_util::property_key_name as property_key_name_opt;

use super::super::comments::{leading_comment_for_span, parse_comment_metadata};
use super::super::slice_span;
use super::super::types::type_to_ref;
use super::super::ExtractionContext;
use crate::tasty::model::{TsMember, TsMemberKind};

pub(crate) fn property_signature_to_member(
    property: &TSPropertySignature<'_>,
    ctx: &ExtractionContext<'_>,
    exclude_starts_between: Option<&[u32]>,
) -> TsMember {
    let name = property_key_name_opt(&property.key, ctx.source)
        .unwrap_or_else(|| slice_span(ctx.source, property.key.span()).to_string());
    let comment = parse_comment_metadata(leading_comment_for_span(
        ctx.source,
        ctx.comments,
        property.span(),
        exclude_starts_between,
    ));
    let type_ref = property
        .type_annotation
        .as_ref()
        .map(|annotation| type_to_ref(&annotation.type_annotation, ctx));

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

pub(crate) fn method_signature_to_member(
    method: &TSMethodSignature<'_>,
    ctx: &ExtractionContext<'_>,
    exclude_starts_between: Option<&[u32]>,
) -> TsMember {
    let name = property_key_name_opt(&method.key, ctx.source)
        .unwrap_or_else(|| slice_span(ctx.source, method.key.span()).to_string());
    let comment = parse_comment_metadata(leading_comment_for_span(
        ctx.source,
        ctx.comments,
        method.span(),
        exclude_starts_between,
    ));
    let type_ref = method
        .return_type
        .as_ref()
        .map(|annotation| type_to_ref(&annotation.type_annotation, ctx));

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

pub(crate) fn call_signature_to_member(
    call: &TSCallSignatureDeclaration<'_>,
    ctx: &ExtractionContext<'_>,
    exclude_starts_between: Option<&[u32]>,
) -> TsMember {
    let comment = parse_comment_metadata(leading_comment_for_span(
        ctx.source,
        ctx.comments,
        call.span(),
        exclude_starts_between,
    ));
    let type_ref = call
        .return_type
        .as_ref()
        .map(|annotation| type_to_ref(&annotation.type_annotation, ctx));

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

pub(crate) fn construct_signature_to_member(
    decl: &TSConstructSignatureDeclaration<'_>,
    ctx: &ExtractionContext<'_>,
    exclude_starts_between: Option<&[u32]>,
) -> TsMember {
    let comment = parse_comment_metadata(leading_comment_for_span(
        ctx.source,
        ctx.comments,
        decl.span(),
        exclude_starts_between,
    ));
    let type_ref = decl
        .return_type
        .as_ref()
        .map(|annotation| type_to_ref(&annotation.type_annotation, ctx));

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

pub(crate) fn index_signature_to_member(
    index: &TSIndexSignature<'_>,
    ctx: &ExtractionContext<'_>,
    exclude_starts_between: Option<&[u32]>,
) -> TsMember {
    let comment = parse_comment_metadata(leading_comment_for_span(
        ctx.source,
        ctx.comments,
        index.span(),
        exclude_starts_between,
    ));
    let type_ref = Some(type_to_ref(&index.type_annotation.type_annotation, ctx));

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

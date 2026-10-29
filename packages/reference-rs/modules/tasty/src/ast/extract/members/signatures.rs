//! Converts one interface or type-literal signature into a `TsMember`: property, method, accessor, call,
//! construct, and index signatures. Each member type lowers with the enclosing binder names bound, and a
//! method, call, or construct signature also binds its own type parameters (`run<Item>(): Item`). An
//! accessor becomes a property member here; `accessors.rs` merges a get and a set into one of them.

use oxc_ast::ast::{
    TSCallSignatureDeclaration, TSConstructSignatureDeclaration, TSIndexSignature,
    TSMethodSignature, TSMethodSignatureKind, TSPropertySignature,
};
use oxc_span::GetSpan;

use crate::shared::type_ref_util::property_key_name as property_key_name_opt;

use super::super::comments::{leading_comment_for_span, parse_comment_metadata};
use super::super::slice_span;
use super::super::types::{
    member_type_to_ref, signature_to_constructor_ref, signature_to_function_ref, SignatureParts,
};
use super::super::ExtractionContext;
use crate::model::{TsMember, TsMemberKind};

pub(crate) fn property_signature_to_member(
    property: &TSPropertySignature<'_>,
    ctx: &ExtractionContext<'_>,
    exclude_starts_between: Option<&[u32]>,
    binders: &[String],
) -> TsMember {
    let name = property_key_name_opt(&property.key, ctx.source)
        .unwrap_or_else(|| slice_span(ctx.source, property.key.span()).to_string());
    let comment = parse_comment_metadata(leading_comment_for_span(
        ctx.source,
        ctx.comments,
        property.span(),
        exclude_starts_between,
    ));
    let type_ref = property.type_annotation.as_ref().map(|annotation| {
        member_type_to_ref(&annotation.type_annotation, ctx, binders, None)
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

pub(crate) fn method_signature_to_member(
    method: &TSMethodSignature<'_>,
    ctx: &ExtractionContext<'_>,
    exclude_starts_between: Option<&[u32]>,
    binders: &[String],
) -> TsMember {
    let name = property_key_name_opt(&method.key, ctx.source)
        .unwrap_or_else(|| slice_span(ctx.source, method.key.span()).to_string());
    let comment = parse_comment_metadata(leading_comment_for_span(
        ctx.source,
        ctx.comments,
        method.span(),
        exclude_starts_between,
    ));
    let type_ref = Some(signature_to_function_ref(
        &SignatureParts {
            params: &method.params,
            return_type: method.return_type.as_deref(),
            type_parameters: method.type_parameters.as_deref(),
        },
        ctx,
        binders,
    ));

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

/// One accessor signature as a property member. A getter is readonly and typed by its return type; a
/// setter is writable and typed by its parameter. `accessors.rs` joins the two when both are present.
pub(crate) fn accessor_signature_to_member(
    method: &TSMethodSignature<'_>,
    ctx: &ExtractionContext<'_>,
    exclude_starts_between: Option<&[u32]>,
    binders: &[String],
) -> TsMember {
    let is_getter = matches!(method.kind, TSMethodSignatureKind::Get);
    let name = property_key_name_opt(&method.key, ctx.source)
        .unwrap_or_else(|| slice_span(ctx.source, method.key.span()).to_string());
    let comment = parse_comment_metadata(leading_comment_for_span(
        ctx.source,
        ctx.comments,
        method.span(),
        exclude_starts_between,
    ));
    let annotation = if is_getter {
        method.return_type.as_ref()
    } else {
        method
            .params
            .items
            .first()
            .and_then(|param| param.type_annotation.as_ref())
    };

    TsMember {
        name,
        optional: false,
        readonly: is_getter,
        kind: TsMemberKind::Property,
        description: comment.description,
        description_raw: comment.description_raw,
        jsdoc: comment.jsdoc,
        type_ref: annotation
            .map(|annotation| member_type_to_ref(&annotation.type_annotation, ctx, binders, None)),
    }
}

pub(crate) fn call_signature_to_member(
    call: &TSCallSignatureDeclaration<'_>,
    ctx: &ExtractionContext<'_>,
    exclude_starts_between: Option<&[u32]>,
    binders: &[String],
) -> TsMember {
    let comment = parse_comment_metadata(leading_comment_for_span(
        ctx.source,
        ctx.comments,
        call.span(),
        exclude_starts_between,
    ));
    let type_ref = Some(signature_to_function_ref(
        &SignatureParts {
            params: &call.params,
            return_type: call.return_type.as_deref(),
            type_parameters: call.type_parameters.as_deref(),
        },
        ctx,
        binders,
    ));

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
    binders: &[String],
) -> TsMember {
    let comment = parse_comment_metadata(leading_comment_for_span(
        ctx.source,
        ctx.comments,
        decl.span(),
        exclude_starts_between,
    ));
    let type_ref = Some(signature_to_constructor_ref(
        &SignatureParts {
            params: &decl.params,
            return_type: decl.return_type.as_deref(),
            type_parameters: decl.type_parameters.as_deref(),
        },
        ctx,
        binders,
    ));

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
    binders: &[String],
) -> TsMember {
    let comment = parse_comment_metadata(leading_comment_for_span(
        ctx.source,
        ctx.comments,
        index.span(),
        exclude_starts_between,
    ));
    let type_ref = Some(member_type_to_ref(
        &index.type_annotation.type_annotation,
        ctx,
        binders,
        None,
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

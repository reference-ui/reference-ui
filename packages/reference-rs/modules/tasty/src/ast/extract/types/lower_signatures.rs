//! Lowering for a method, call, or construct signature into a callable `TypeRef`.
//! Takes the signature's parameter list, optional return annotation, and own type parameters, and emits
//! the same `Function` or `Constructor` shape a function-typed property gets, so a method reads like a
//! callback property downstream. A signature with no return annotation returns `any`, as tsc infers.

use oxc_ast::ast::{FormalParameters, TSTypeAnnotation, TSTypeParameterDeclaration};

use crate::ast::extract::ExtractionContext;
use crate::model::TypeRef;

use super::{intrinsic, LoweringContext};

/// The parts of one signature declaration that make up its callable type.
pub(in crate::ast::extract) struct SignatureParts<'p, 'a> {
    pub params: &'p FormalParameters<'a>,
    pub return_type: Option<&'p TSTypeAnnotation<'a>>,
    pub type_parameters: Option<&'p TSTypeParameterDeclaration<'a>>,
}

/// Lowers a method or call signature to a `Function` type, binding its own type parameters.
pub(in crate::ast::extract) fn signature_to_function_ref(
    parts: &SignatureParts<'_, '_>,
    ctx: &ExtractionContext<'_>,
    binders: &[String],
) -> TypeRef {
    let scope = scope_for(parts, ctx, binders);
    TypeRef::Function {
        params: scope.lower_fn_params(parts.params),
        return_type: Box::new(scope.lower_return(parts.return_type)),
    }
}

/// Lowers a construct signature to a `Constructor` type, binding its own type parameters.
pub(in crate::ast::extract) fn signature_to_constructor_ref(
    parts: &SignatureParts<'_, '_>,
    ctx: &ExtractionContext<'_>,
    binders: &[String],
) -> TypeRef {
    let base = LoweringContext::with_bound(ctx, binders.to_vec());
    let scope = scope_for(parts, ctx, binders);
    TypeRef::Constructor {
        r#abstract: false,
        type_parameters: base.lower_type_parameters(parts.type_parameters),
        params: scope.lower_fn_params(parts.params),
        return_type: Box::new(scope.lower_return(parts.return_type)),
    }
}

fn scope_for<'c>(
    parts: &SignatureParts<'_, '_>,
    ctx: &'c ExtractionContext<'c>,
    binders: &[String],
) -> LoweringContext<'c> {
    let base = LoweringContext::with_bound(ctx, binders.to_vec());
    base.bind(base.declared_names(parts.type_parameters))
}

impl LoweringContext<'_> {
    fn lower_return(&self, annotation: Option<&TSTypeAnnotation<'_>>) -> TypeRef {
        annotation.map_or_else(
            || intrinsic("any"),
            |annotation| self.lower_type(&annotation.type_annotation),
        )
    }
}

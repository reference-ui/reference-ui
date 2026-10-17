//! Structural [`TypeRef`] → [`TypeRef`] maps shared by resolve and instantiate.
//!
//! The [`TypeRefMap`] trait supplies hooks for variants that differ between passes. [`map_type_ref`] is the one
//! exhaustive match over the variants, grouped by family; each family function matches only its own variants and
//! recurses through `map_type_ref` for children, so a new variant is a compile error at the router until it is
//! routed. A variant with child types also needs emit in `generator/types`, which is string output.

use crate::model::{
    FnParam, TemplateLiteralPart, TsMember, TsTypeParameter, TupleElement, TypeOperatorKind,
    TypeRef,
};

/// The fields of a [`TypeRef::Reference`], handed to [`TypeRefMap::map_reference`] as one value.
pub struct ReferenceParts {
    pub name: String,
    pub target_id: Option<String>,
    pub source_module: Option<String>,
    pub type_arguments: Option<Vec<TypeRef>>,
    pub type_parameter: bool,
}

/// The fields of a [`TypeRef::Conditional`] with its branches already mapped, handed to
/// [`TypeRefMap::map_conditional`] as one value.
pub struct ConditionalParts {
    pub check_type: TypeRef,
    pub extends_type: TypeRef,
    pub true_type: TypeRef,
    pub false_type: TypeRef,
    pub resolved: Option<Box<TypeRef>>,
}

/// Hooks for resolve vs instantiate where behavior diverges; structural recursion
/// lives in [`map_type_ref`].
pub trait TypeRefMap {
    fn map_reference(&mut self, reference: ReferenceParts) -> TypeRef;

    fn map_indexed_access(
        &mut self,
        object: TypeRef,
        index: TypeRef,
        resolved: Option<Box<TypeRef>>,
    ) -> TypeRef;

    fn map_type_operator(
        &mut self,
        operator: TypeOperatorKind,
        target: TypeRef,
        resolved: Option<Box<TypeRef>>,
    ) -> TypeRef;

    fn map_type_query(&mut self, expression: String, resolved: Option<Box<TypeRef>>) -> TypeRef;

    fn map_conditional(&mut self, parts: ConditionalParts) -> TypeRef;

    fn map_template_literal(
        &mut self,
        parts: Vec<TemplateLiteralPart>,
        resolved: Option<Box<TypeRef>>,
    ) -> TypeRef;

    fn map_type_parameter(&mut self, param: TsTypeParameter) -> TsTypeParameter;

    fn map_tuple_element(&mut self, element: TupleElement) -> TupleElement;

    fn map_member(&mut self, member: TsMember) -> TsMember {
        TsMember {
            type_ref: member.type_ref.map(|t| map_type_ref(self, t)),
            ..member
        }
    }

    fn map_fn_param(&mut self, param: FnParam) -> FnParam {
        FnParam {
            type_ref: param.type_ref.map(|t| map_type_ref(self, t)),
            ..param
        }
    }
}

pub fn map_template_literal_part<M: TypeRefMap + ?Sized>(
    mapper: &mut M,
    part: TemplateLiteralPart,
) -> TemplateLiteralPart {
    match part {
        TemplateLiteralPart::Text { value } => TemplateLiteralPart::Text { value },
        TemplateLiteralPart::Type { value } => TemplateLiteralPart::Type {
            value: map_type_ref(mapper, value),
        },
    }
}

/// Maps one [`TypeRef`] and its children through `mapper`. This is the one exhaustive match: each arm hands a whole
/// family to its function below, and no family function calls another.
pub fn map_type_ref<M: TypeRefMap + ?Sized>(mapper: &mut M, type_ref: TypeRef) -> TypeRef {
    match type_ref {
        reference_or_leaf @ (TypeRef::Reference { .. }
        | TypeRef::Intrinsic { .. }
        | TypeRef::Literal { .. }
        | TypeRef::Raw { .. }) => map_reference_or_leaf_ref(mapper, reference_or_leaf),
        composite @ (TypeRef::Union { .. }
        | TypeRef::Intersection { .. }
        | TypeRef::Array { .. }
        | TypeRef::Tuple { .. }) => map_composite_ref(mapper, composite),
        signature @ (TypeRef::Object { .. }
        | TypeRef::Function { .. }
        | TypeRef::Constructor { .. }) => map_signature_ref(mapper, signature),
        access @ (TypeRef::IndexedAccess { .. }
        | TypeRef::TypeOperator { .. }
        | TypeRef::TypeQuery { .. }) => map_access_ref(mapper, access),
        binder @ (TypeRef::Conditional { .. }
        | TypeRef::TemplateLiteral { .. }
        | TypeRef::Mapped { .. }) => map_binder_ref(mapper, binder),
    }
}

/// A reference hands its fields to `map_reference` as one value. The leaves carry no child types, so they map to
/// themselves.
fn map_reference_or_leaf_ref<M: TypeRefMap + ?Sized>(mapper: &mut M, type_ref: TypeRef) -> TypeRef {
    match type_ref {
        TypeRef::Reference {
            name,
            target_id,
            source_module,
            type_arguments,
            type_parameter,
        } => mapper.map_reference(ReferenceParts {
            name,
            target_id,
            source_module,
            type_arguments,
            type_parameter,
        }),
        leaf @ (TypeRef::Intrinsic { .. } | TypeRef::Literal { .. } | TypeRef::Raw { .. }) => leaf,
        _ => unreachable!("map_type_ref routes only reference and leaf variants here"),
    }
}

/// Unions, intersections, arrays and tuples: each child is mapped in place.
fn map_composite_ref<M: TypeRefMap + ?Sized>(mapper: &mut M, type_ref: TypeRef) -> TypeRef {
    match type_ref {
        TypeRef::Union { types } => TypeRef::Union {
            types: map_all(mapper, types),
        },
        TypeRef::Intersection { types } => TypeRef::Intersection {
            types: map_all(mapper, types),
        },
        TypeRef::Array { element } => TypeRef::Array {
            element: Box::new(map_type_ref(mapper, *element)),
        },
        TypeRef::Tuple { elements } => TypeRef::Tuple {
            elements: elements
                .into_iter()
                .map(|e| mapper.map_tuple_element(e))
                .collect(),
        },
        _ => unreachable!("map_type_ref routes only composite variants here"),
    }
}

/// Object literals and call or construct signatures: their members and parameters go through the member hooks.
fn map_signature_ref<M: TypeRefMap + ?Sized>(mapper: &mut M, type_ref: TypeRef) -> TypeRef {
    match type_ref {
        TypeRef::Object { members } => TypeRef::Object {
            members: members.into_iter().map(|m| mapper.map_member(m)).collect(),
        },
        TypeRef::Function {
            params,
            return_type,
        } => TypeRef::Function {
            params: params.into_iter().map(|p| mapper.map_fn_param(p)).collect(),
            return_type: Box::new(map_type_ref(mapper, *return_type)),
        },
        TypeRef::Constructor {
            r#abstract,
            type_parameters,
            params,
            return_type,
        } => TypeRef::Constructor {
            r#abstract,
            type_parameters: type_parameters
                .into_iter()
                .map(|p| mapper.map_type_parameter(p))
                .collect(),
            params: params.into_iter().map(|p| mapper.map_fn_param(p)).collect(),
            return_type: Box::new(map_type_ref(mapper, *return_type)),
        },
        _ => unreachable!("map_type_ref routes only signature variants here"),
    }
}

/// Indexed access, type operators, and type queries: each operand or expression goes through its hook, with the
/// resolved result mapped alongside.
fn map_access_ref<M: TypeRefMap + ?Sized>(mapper: &mut M, type_ref: TypeRef) -> TypeRef {
    match type_ref {
        TypeRef::IndexedAccess {
            object,
            index,
            resolved,
        } => {
            let o = map_type_ref(mapper, *object);
            let i = map_type_ref(mapper, *index);
            let r = map_boxed(mapper, resolved);
            mapper.map_indexed_access(o, i, r)
        }
        TypeRef::TypeOperator {
            operator,
            target,
            resolved,
        } => {
            let t = map_type_ref(mapper, *target);
            let r = map_boxed(mapper, resolved);
            mapper.map_type_operator(operator, t, r)
        }
        TypeRef::TypeQuery {
            expression,
            resolved,
        } => {
            let r = map_boxed(mapper, resolved);
            mapper.map_type_query(expression, r)
        }
        _ => unreachable!("map_type_ref routes only access variants here"),
    }
}

/// Conditional, template literal, and mapped types, which bind names of their own. The conditional and template
/// literal hand their parts to hooks, and the mapped type is rebuilt around its mapped children.
fn map_binder_ref<M: TypeRefMap + ?Sized>(mapper: &mut M, type_ref: TypeRef) -> TypeRef {
    match type_ref {
        TypeRef::Conditional {
            check_type,
            extends_type,
            true_type,
            false_type,
            resolved,
        } => {
            let parts = ConditionalParts {
                check_type: map_type_ref(mapper, *check_type),
                extends_type: map_type_ref(mapper, *extends_type),
                true_type: map_type_ref(mapper, *true_type),
                false_type: map_type_ref(mapper, *false_type),
                resolved: map_boxed(mapper, resolved),
            };
            mapper.map_conditional(parts)
        }
        TypeRef::TemplateLiteral { parts, resolved } => {
            let mapped_parts = parts
                .into_iter()
                .map(|p| map_template_literal_part(mapper, p))
                .collect::<Vec<_>>();
            let r = map_boxed(mapper, resolved);
            mapper.map_template_literal(mapped_parts, r)
        }
        TypeRef::Mapped {
            type_param,
            source_type,
            name_type,
            optional_modifier,
            readonly_modifier,
            value_type,
        } => TypeRef::Mapped {
            type_param,
            source_type: Box::new(map_type_ref(mapper, *source_type)),
            name_type: name_type.map(|n| Box::new(map_type_ref(mapper, *n))),
            optional_modifier,
            readonly_modifier,
            value_type: value_type.map(|v| Box::new(map_type_ref(mapper, *v))),
        },
        _ => unreachable!("map_type_ref routes only binder variants here"),
    }
}

fn map_boxed<M: TypeRefMap + ?Sized>(
    mapper: &mut M,
    resolved: Option<Box<TypeRef>>,
) -> Option<Box<TypeRef>> {
    resolved.map(|r| Box::new(map_type_ref(mapper, *r)))
}

fn map_all<M: TypeRefMap + ?Sized>(mapper: &mut M, types: Vec<TypeRef>) -> Vec<TypeRef> {
    types.into_iter().map(|t| map_type_ref(mapper, t)).collect()
}

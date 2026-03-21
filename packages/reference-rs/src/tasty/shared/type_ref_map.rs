//! Structural [`TypeRef`] → [`TypeRef`] maps shared by resolve and instantiate.
//!
//! The [`TypeRefMap`] trait supplies hooks for variants that differ between passes;
//! [`map_type_ref`] holds the single full `match` so new `TypeRef` variants get
//! one place to update (plus emit in `generator/types`, which is string output).

use crate::tasty::model::{
    FnParam, TemplateLiteralPart, TsMember, TsTypeParameter, TupleElement, TypeOperatorKind,
    TypeRef,
};

/// Hooks for resolve vs instantiate where behavior diverges; structural recursion
/// lives in [`map_type_ref`].
pub trait TypeRefMap {
    fn map_reference(
        &mut self,
        name: String,
        target_id: Option<String>,
        source_module: Option<String>,
        type_arguments: Option<Vec<TypeRef>>,
    ) -> TypeRef;

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

    fn map_conditional(
        &mut self,
        check_type: TypeRef,
        extends_type: TypeRef,
        true_type: TypeRef,
        false_type: TypeRef,
        resolved: Option<Box<TypeRef>>,
    ) -> TypeRef;

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

pub fn map_type_ref<M: TypeRefMap + ?Sized>(mapper: &mut M, type_ref: TypeRef) -> TypeRef {
    match type_ref {
        TypeRef::Intrinsic { name } => TypeRef::Intrinsic { name },
        TypeRef::Literal { value } => TypeRef::Literal { value },
        TypeRef::Reference {
            name,
            target_id,
            source_module,
            type_arguments,
        } => mapper.map_reference(name, target_id, source_module, type_arguments),
        TypeRef::Union { types } => TypeRef::Union {
            types: types.into_iter().map(|t| map_type_ref(mapper, t)).collect(),
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
        TypeRef::Intersection { types } => TypeRef::Intersection {
            types: types.into_iter().map(|t| map_type_ref(mapper, t)).collect(),
        },
        TypeRef::Object { members } => TypeRef::Object {
            members: members
                .into_iter()
                .map(|m| mapper.map_member(m))
                .collect(),
        },
        TypeRef::IndexedAccess {
            object,
            index,
            resolved,
        } => {
            let o = map_type_ref(mapper, *object);
            let i = map_type_ref(mapper, *index);
            let r = resolved.map(|r| Box::new(map_type_ref(mapper, *r)));
            mapper.map_indexed_access(o, i, r)
        }
        TypeRef::Function {
            params,
            return_type,
        } => TypeRef::Function {
            params: params
                .into_iter()
                .map(|p| mapper.map_fn_param(p))
                .collect(),
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
            params: params
                .into_iter()
                .map(|p| mapper.map_fn_param(p))
                .collect(),
            return_type: Box::new(map_type_ref(mapper, *return_type)),
        },
        TypeRef::TypeOperator {
            operator,
            target,
            resolved,
        } => {
            let t = map_type_ref(mapper, *target);
            let r = resolved.map(|r| Box::new(map_type_ref(mapper, *r)));
            mapper.map_type_operator(operator, t, r)
        }
        TypeRef::TypeQuery {
            expression,
            resolved,
        } => {
            let r = resolved.map(|r| Box::new(map_type_ref(mapper, *r)));
            mapper.map_type_query(expression, r)
        }
        TypeRef::Conditional {
            check_type,
            extends_type,
            true_type,
            false_type,
            resolved,
        } => {
            let ct = map_type_ref(mapper, *check_type);
            let et = map_type_ref(mapper, *extends_type);
            let tt = map_type_ref(mapper, *true_type);
            let ft = map_type_ref(mapper, *false_type);
            let r = resolved.map(|r| Box::new(map_type_ref(mapper, *r)));
            mapper.map_conditional(ct, et, tt, ft, r)
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
        TypeRef::TemplateLiteral { parts, resolved } => {
            let mapped_parts = parts
                .into_iter()
                .map(|p| map_template_literal_part(mapper, p))
                .collect::<Vec<_>>();
            let r = resolved.map(|r| Box::new(map_type_ref(mapper, *r)));
            mapper.map_template_literal(mapped_parts, r)
        }
        TypeRef::Raw { summary } => TypeRef::Raw { summary },
    }
}

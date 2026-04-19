//! Identity [`TypeRefMap`](crate::tasty::shared::type_ref_map::TypeRefMap) for round-trip tests.

use crate::tasty::model::{
    TemplateLiteralPart, TsTypeParameter, TupleElement, TypeOperatorKind, TypeRef,
};
use crate::tasty::shared::type_ref_map::{map_type_ref, TypeRefMap};

/// Passes every [`TypeRef`] through unchanged; [`map_reference`] must still remap
/// `type_arguments` because [`map_type_ref`] delegates them to the mapper without
/// pre-walking.
pub(crate) struct IdentityMap;

impl TypeRefMap for IdentityMap {
    fn map_reference(
        &mut self,
        name: String,
        target_id: Option<String>,
        source_module: Option<String>,
        type_arguments: Option<Vec<TypeRef>>,
    ) -> TypeRef {
        TypeRef::Reference {
            name,
            target_id,
            source_module,
            type_arguments: type_arguments
                .map(|args| args.into_iter().map(|t| map_type_ref(self, t)).collect()),
        }
    }

    fn map_indexed_access(
        &mut self,
        object: TypeRef,
        index: TypeRef,
        resolved: Option<Box<TypeRef>>,
    ) -> TypeRef {
        TypeRef::IndexedAccess {
            object: Box::new(object),
            index: Box::new(index),
            resolved,
        }
    }

    fn map_type_operator(
        &mut self,
        operator: TypeOperatorKind,
        target: TypeRef,
        resolved: Option<Box<TypeRef>>,
    ) -> TypeRef {
        TypeRef::TypeOperator {
            operator,
            target: Box::new(target),
            resolved,
        }
    }

    fn map_type_query(&mut self, expression: String, resolved: Option<Box<TypeRef>>) -> TypeRef {
        TypeRef::TypeQuery {
            expression,
            resolved,
        }
    }

    fn map_conditional(
        &mut self,
        check_type: TypeRef,
        extends_type: TypeRef,
        true_type: TypeRef,
        false_type: TypeRef,
        resolved: Option<Box<TypeRef>>,
    ) -> TypeRef {
        TypeRef::Conditional {
            check_type: Box::new(check_type),
            extends_type: Box::new(extends_type),
            true_type: Box::new(true_type),
            false_type: Box::new(false_type),
            resolved,
        }
    }

    fn map_template_literal(
        &mut self,
        parts: Vec<TemplateLiteralPart>,
        resolved: Option<Box<TypeRef>>,
    ) -> TypeRef {
        TypeRef::TemplateLiteral { parts, resolved }
    }

    fn map_type_parameter(&mut self, param: TsTypeParameter) -> TsTypeParameter {
        TsTypeParameter {
            name: param.name,
            constraint: param.constraint.map(|c| map_type_ref(self, c)),
            default: param.default.map(|d| map_type_ref(self, d)),
        }
    }

    fn map_tuple_element(&mut self, element: TupleElement) -> TupleElement {
        TupleElement {
            label: element.label,
            optional: element.optional,
            rest: element.rest,
            readonly: element.readonly,
            element: element.element,
        }
    }
}

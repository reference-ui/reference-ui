//! Clears the binder marks once a symbol's resolution is complete. A reference bound by a type parameter or an
//! `infer` variable carries its own name as its target id, a value no symbol id ever has, so the resolver and
//! evaluation never attach or dereference it. This walk turns each such mark back into the `None` target an
//! unresolved name has, and it keeps the `type_parameter` flag, which is what still tells the reference apart
//! from an unresolved external name. It reaches the `resolved` results too, because evaluation can copy a
//! marked reference into them. A shadowing binder keeps its `#binder` marker, which is not its own name, so this walk
//! leaves that marker in place.

use crate::model::{TemplateLiteralPart, TsTypeParameter, TupleElement, TypeOperatorKind, TypeRef};
use crate::shared::type_ref_map::{map_type_ref, ConditionalParts, ReferenceParts, TypeRefMap};

pub(super) fn clear_binder_targets(type_ref: TypeRef) -> TypeRef {
    map_type_ref(&mut ClearBinderTargets, type_ref)
}

struct ClearBinderTargets;

impl TypeRefMap for ClearBinderTargets {
    fn map_reference(&mut self, reference: ReferenceParts) -> TypeRef {
        let ReferenceParts {
            name,
            target_id,
            source_module,
            type_arguments,
            type_parameter,
        } = reference;
        let target_id = if type_parameter && target_id.as_deref() == Some(name.as_str()) {
            None
        } else {
            target_id
        };
        let type_arguments = type_arguments.map(|args| {
            args.into_iter()
                .map(|arg| map_type_ref(self, arg))
                .collect()
        });
        TypeRef::Reference {
            name,
            target_id,
            source_module,
            type_arguments,
            type_parameter,
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

    fn map_conditional(&mut self, parts: ConditionalParts) -> TypeRef {
        let ConditionalParts {
            check_type,
            extends_type,
            true_type,
            false_type,
            resolved,
        } = parts;
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
            constraint: param.constraint.map(|t| map_type_ref(self, t)),
            default: param.default.map(|t| map_type_ref(self, t)),
        }
    }

    fn map_tuple_element(&mut self, element: TupleElement) -> TupleElement {
        TupleElement {
            element: map_type_ref(self, element.element),
            ..element
        }
    }
}

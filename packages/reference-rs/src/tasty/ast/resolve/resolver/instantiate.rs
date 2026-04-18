use std::collections::BTreeMap;

use super::Resolver;
use crate::tasty::ast::model::SymbolShell;
use crate::tasty::model::{
    TemplateLiteralPart, TsTypeParameter, TupleElement, TypeOperatorKind, TypeRef,
};
use crate::tasty::shared::type_ref_map::{map_type_ref, TypeRefMap};

impl<'a> Resolver<'a> {
    pub(super) fn instantiate_symbol_type_alias(
        &self,
        symbol: &SymbolShell,
        underlying: &TypeRef,
        type_arguments: Option<&[TypeRef]>,
    ) -> TypeRef {
        let substitutions = self.build_type_substitutions(&symbol.type_parameters, type_arguments);
        if substitutions.is_empty() {
            return underlying.clone();
        }

        self.instantiate_type_ref(underlying, &substitutions)
    }

    fn build_type_substitutions(
        &self,
        type_parameters: &[TsTypeParameter],
        type_arguments: Option<&[TypeRef]>,
    ) -> BTreeMap<String, TypeRef> {
        let resolved_arguments = type_arguments.unwrap_or(&[]);
        let mut substitutions = BTreeMap::new();

        for (index, parameter) in type_parameters.iter().enumerate() {
            let argument = resolved_arguments.get(index).cloned().or_else(|| {
                parameter
                    .default
                    .clone()
                    .map(|default| self.resolve_type_ref(default))
            });
            if let Some(argument) = argument {
                substitutions.insert(parameter.name.clone(), argument);
            }
        }

        substitutions
    }

    fn instantiate_type_ref(
        &self,
        type_ref: &TypeRef,
        substitutions: &BTreeMap<String, TypeRef>,
    ) -> TypeRef {
        let mut mapper = InstantiateTypeRefMap { substitutions };
        map_type_ref(&mut mapper, type_ref.clone())
    }
}

struct InstantiateTypeRefMap<'a> {
    substitutions: &'a BTreeMap<String, TypeRef>,
}

impl TypeRefMap for InstantiateTypeRefMap<'_> {
    fn map_reference(
        &mut self,
        name: String,
        target_id: Option<String>,
        source_module: Option<String>,
        type_arguments: Option<Vec<TypeRef>>,
    ) -> TypeRef {
        if target_id.is_none() && source_module.is_none() {
            if let Some(substitution) = self.substitutions.get(&name) {
                return substitution.clone();
            }
        }

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
        param.clone()
    }

    fn map_tuple_element(&mut self, element: TupleElement) -> TupleElement {
        TupleElement {
            element: map_type_ref(self, element.element),
            ..element
        }
    }
}

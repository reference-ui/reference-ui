use std::collections::BTreeMap;

use crate::tasty::ast::model::SymbolShell;
use crate::tasty::model::{
    FnParam, TemplateLiteralPart, TsMember, TsTypeParameter, TupleElement, TypeRef,
};
use super::Resolver;

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
            let argument = resolved_arguments
                .get(index)
                .cloned()
                .or_else(|| parameter.default.clone().map(|default| self.resolve_type_ref(default)));
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
        match type_ref {
            TypeRef::Reference {
                name,
                target_id,
                source_module,
                type_arguments,
            } => {
                if target_id.is_none() && source_module.is_none() {
                    if let Some(substitution) = substitutions.get(name) {
                        return substitution.clone();
                    }
                }

                TypeRef::Reference {
                    name: name.clone(),
                    target_id: target_id.clone(),
                    source_module: source_module.clone(),
                    type_arguments: type_arguments.as_ref().map(|arguments| {
                        arguments
                            .iter()
                            .map(|argument| self.instantiate_type_ref(argument, substitutions))
                            .collect()
                    }),
                }
            }
            TypeRef::Union { types } => TypeRef::Union {
                types: types
                    .iter()
                    .map(|item| self.instantiate_type_ref(item, substitutions))
                    .collect(),
            },
            TypeRef::Array { element } => TypeRef::Array {
                element: Box::new(self.instantiate_type_ref(element, substitutions)),
            },
            TypeRef::Tuple { elements } => TypeRef::Tuple {
                elements: elements
                    .iter()
                    .map(|element| TupleElement {
                        label: element.label.clone(),
                        optional: element.optional,
                        rest: element.rest,
                        element: self.instantiate_type_ref(&element.element, substitutions),
                    })
                    .collect(),
            },
            TypeRef::Intersection { types } => TypeRef::Intersection {
                types: types
                    .iter()
                    .map(|item| self.instantiate_type_ref(item, substitutions))
                    .collect(),
            },
            TypeRef::Object { members } => TypeRef::Object {
                members: members
                    .iter()
                    .map(|member| self.instantiate_member(member, substitutions))
                    .collect(),
            },
            TypeRef::IndexedAccess {
                object,
                index,
                resolved,
            } => TypeRef::IndexedAccess {
                object: Box::new(self.instantiate_type_ref(object, substitutions)),
                index: Box::new(self.instantiate_type_ref(index, substitutions)),
                resolved: resolved
                    .as_ref()
                    .map(|resolved| Box::new(self.instantiate_type_ref(resolved, substitutions))),
            },
            TypeRef::Function {
                params,
                return_type,
            } => TypeRef::Function {
                params: params
                    .iter()
                    .map(|param| self.instantiate_fn_param(param, substitutions))
                    .collect(),
                return_type: Box::new(self.instantiate_type_ref(return_type, substitutions)),
            },
            TypeRef::Constructor {
                r#abstract,
                type_parameters,
                params,
                return_type,
            } => TypeRef::Constructor {
                r#abstract: *r#abstract,
                type_parameters: type_parameters.clone(),
                params: params
                    .iter()
                    .map(|param| self.instantiate_fn_param(param, substitutions))
                    .collect(),
                return_type: Box::new(self.instantiate_type_ref(return_type, substitutions)),
            },
            TypeRef::TypeOperator {
                operator,
                target,
                resolved,
            } => TypeRef::TypeOperator {
                operator: *operator,
                target: Box::new(self.instantiate_type_ref(target, substitutions)),
                resolved: resolved
                    .as_ref()
                    .map(|resolved| Box::new(self.instantiate_type_ref(resolved, substitutions))),
            },
            TypeRef::TypeQuery {
                expression,
                resolved,
            } => TypeRef::TypeQuery {
                expression: expression.clone(),
                resolved: resolved
                    .as_ref()
                    .map(|resolved| Box::new(self.instantiate_type_ref(resolved, substitutions))),
            },
            TypeRef::Conditional {
                check_type,
                extends_type,
                true_type,
                false_type,
                resolved,
            } => TypeRef::Conditional {
                check_type: Box::new(self.instantiate_type_ref(check_type, substitutions)),
                extends_type: Box::new(self.instantiate_type_ref(extends_type, substitutions)),
                true_type: Box::new(self.instantiate_type_ref(true_type, substitutions)),
                false_type: Box::new(self.instantiate_type_ref(false_type, substitutions)),
                resolved: resolved
                    .as_ref()
                    .map(|resolved| Box::new(self.instantiate_type_ref(resolved, substitutions))),
            },
            TypeRef::Mapped {
                type_param,
                source_type,
                name_type,
                optional_modifier,
                readonly_modifier,
                value_type,
            } => TypeRef::Mapped {
                type_param: type_param.clone(),
                source_type: Box::new(self.instantiate_type_ref(source_type, substitutions)),
                name_type: name_type
                    .as_ref()
                    .map(|name_type| Box::new(self.instantiate_type_ref(name_type, substitutions))),
                optional_modifier: *optional_modifier,
                readonly_modifier: *readonly_modifier,
                value_type: value_type
                    .as_ref()
                    .map(|value_type| Box::new(self.instantiate_type_ref(value_type, substitutions))),
            },
            TypeRef::TemplateLiteral { parts, resolved } => TypeRef::TemplateLiteral {
                parts: parts
                    .iter()
                    .map(|part| self.instantiate_template_literal_part(part, substitutions))
                    .collect(),
                resolved: resolved
                    .as_ref()
                    .map(|resolved| Box::new(self.instantiate_type_ref(resolved, substitutions))),
            },
            other => other.clone(),
        }
    }

    fn instantiate_member(
        &self,
        member: &TsMember,
        substitutions: &BTreeMap<String, TypeRef>,
    ) -> TsMember {
        TsMember {
            name: member.name.clone(),
            optional: member.optional,
            readonly: member.readonly,
            kind: member.kind,
            description: member.description.clone(),
            description_raw: member.description_raw.clone(),
            jsdoc: member.jsdoc.clone(),
            type_ref: member
                .type_ref
                .as_ref()
                .map(|type_ref| self.instantiate_type_ref(type_ref, substitutions)),
        }
    }

    fn instantiate_fn_param(
        &self,
        param: &FnParam,
        substitutions: &BTreeMap<String, TypeRef>,
    ) -> FnParam {
        FnParam {
            name: param.name.clone(),
            optional: param.optional,
            type_ref: param
                .type_ref
                .as_ref()
                .map(|type_ref| self.instantiate_type_ref(type_ref, substitutions)),
        }
    }

    fn instantiate_template_literal_part(
        &self,
        part: &TemplateLiteralPart,
        substitutions: &BTreeMap<String, TypeRef>,
    ) -> TemplateLiteralPart {
        match part {
            TemplateLiteralPart::Text { value } => TemplateLiteralPart::Text {
                value: value.clone(),
            },
            TemplateLiteralPart::Type { value } => TemplateLiteralPart::Type {
                value: self.instantiate_type_ref(value, substitutions),
            },
        }
    }
}

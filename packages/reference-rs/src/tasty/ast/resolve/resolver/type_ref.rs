use std::collections::BTreeMap;

use super::super::super::super::model::{
    FnParam, TemplateLiteralPart, TsMember, TsSymbolKind, TsTypeParameter, TupleElement, TypeRef,
};
use super::super::super::model::{ImportBindingKind, SymbolShell};
use super::super::names::{namespace_export_lookup_name, reference_lookup_name};
use super::Resolver;

impl<'a> Resolver<'a> {
    pub(super) fn resolve_type_ref(&self, type_ref: TypeRef) -> TypeRef {
        match type_ref {
            TypeRef::Reference {
                name,
                target_id,
                source_module,
                type_arguments,
            } => self.resolve_reference(name, target_id, source_module, type_arguments),
            TypeRef::Union { types } => TypeRef::Union {
                types: self.resolve_type_refs(types),
            },
            TypeRef::Array { element } => TypeRef::Array {
                element: Box::new(self.resolve_type_ref(*element)),
            },
            TypeRef::Tuple { elements } => TypeRef::Tuple {
                elements: elements
                    .into_iter()
                    .map(|element| TupleElement {
                        element: self.resolve_type_ref(element.element),
                        ..element
                    })
                    .collect(),
            },
            TypeRef::Intersection { types } => TypeRef::Intersection {
                types: self.resolve_type_refs(types),
            },
            TypeRef::Object { members } => TypeRef::Object {
                members: members
                    .into_iter()
                    .map(|member| self.resolve_member(member))
                    .collect(),
            },
            TypeRef::IndexedAccess { object, index, .. } => {
                let resolved_object = self.resolve_type_ref(*object);
                let resolved_index = self.resolve_type_ref(*index);
                let resolved = self
                    .resolve_indexed_access_result(&resolved_object, &resolved_index)
                    .map(Box::new);

                TypeRef::IndexedAccess {
                    object: Box::new(resolved_object),
                    index: Box::new(resolved_index),
                    resolved,
                }
            }
            TypeRef::Function {
                params,
                return_type,
            } => TypeRef::Function {
                params: params
                    .into_iter()
                    .map(|param| self.resolve_fn_param(param))
                    .collect(),
                return_type: Box::new(self.resolve_type_ref(*return_type)),
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
                    .map(|param| self.resolve_type_parameter(param))
                    .collect(),
                params: params
                    .into_iter()
                    .map(|param| self.resolve_fn_param(param))
                    .collect(),
                return_type: Box::new(self.resolve_type_ref(*return_type)),
            },
            TypeRef::TypeOperator { operator, target, .. } => {
                let resolved_target = self.resolve_type_ref(*target);
                let resolved = self
                    .resolve_type_operator_result(operator, &resolved_target)
                    .map(Box::new);

                TypeRef::TypeOperator {
                    operator,
                    target: Box::new(resolved_target),
                    resolved,
                }
            }
            TypeRef::TypeQuery { expression, .. } => TypeRef::TypeQuery {
                resolved: self
                    .resolve_type_query_expression(&expression)
                    .map(|resolved| Box::new(self.resolve_type_ref(resolved))),
                expression,
            },
            TypeRef::Conditional {
                check_type,
                extends_type,
                true_type,
                false_type,
                ..
            } => {
                let resolved_check_type = self.resolve_type_ref(*check_type);
                let resolved_extends_type = self.resolve_type_ref(*extends_type);
                let resolved_true_type = self.resolve_type_ref(*true_type);
                let resolved_false_type = self.resolve_type_ref(*false_type);
                let resolved = self
                    .resolve_conditional_result(
                        &resolved_check_type,
                        &resolved_extends_type,
                        &resolved_true_type,
                        &resolved_false_type,
                    )
                    .map(Box::new);

                TypeRef::Conditional {
                    check_type: Box::new(resolved_check_type),
                    extends_type: Box::new(resolved_extends_type),
                    true_type: Box::new(resolved_true_type),
                    false_type: Box::new(resolved_false_type),
                    resolved,
                }
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
                source_type: Box::new(self.resolve_type_ref(*source_type)),
                name_type: name_type.map(|name_type| Box::new(self.resolve_type_ref(*name_type))),
                optional_modifier,
                readonly_modifier,
                value_type: value_type
                    .map(|value_type| Box::new(self.resolve_type_ref(*value_type))),
            },
            TypeRef::TemplateLiteral { parts, .. } => {
                let resolved_parts = parts
                    .into_iter()
                    .map(|part| self.resolve_template_literal_part(part))
                    .collect::<Vec<_>>();
                let resolved = self
                    .resolve_template_literal_result(&resolved_parts)
                    .map(Box::new);

                TypeRef::TemplateLiteral {
                    parts: resolved_parts,
                    resolved,
                }
            }
            other => other,
        }
    }

    fn resolve_reference(
        &self,
        name: String,
        target_id: Option<String>,
        source_module: Option<String>,
        type_arguments: Option<Vec<TypeRef>>,
    ) -> TypeRef {
        let resolved_args = type_arguments.map(|args| self.resolve_type_refs(args));

        if target_id.is_some() {
            return TypeRef::Reference {
                name,
                target_id,
                source_module,
                type_arguments: resolved_args,
            };
        }

        let resolved_target_id = self
            .resolve_import_target_id(&name)
            .or_else(|| self.resolve_local_target_id(&name));

        TypeRef::Reference {
            name,
            target_id: resolved_target_id,
            source_module,
            type_arguments: resolved_args,
        }
    }

    fn resolve_import_target_id(&self, name: &str) -> Option<String> {
        let lookup_name = reference_lookup_name(name);
        let binding = self.parsed.import_bindings.get(lookup_name)?;
        let target_file_id = binding.target_file_id.as_ref()?;
        let export_name = match binding.kind {
            ImportBindingKind::Namespace => namespace_export_lookup_name(name)?,
            _ => binding.imported_name.as_str(),
        };

        self.export_index
            .get(&(target_file_id.clone(), export_name.to_string()))
            .cloned()
    }

    fn resolve_local_target_id(&self, name: &str) -> Option<String> {
        self.symbol_index
            .get(&(self.parsed.file_id.clone(), name.to_string()))
            .cloned()
    }

    fn resolve_type_refs(&self, type_refs: Vec<TypeRef>) -> Vec<TypeRef> {
        type_refs
            .into_iter()
            .map(|type_ref| self.resolve_type_ref(type_ref))
            .collect()
    }

    fn resolve_type_query_expression(&self, expression: &str) -> Option<TypeRef> {
        let mut path = expression.split('.');
        let first = path.next()?;
        let mut current = self.parsed.value_bindings.get(first)?.clone();

        for segment in path {
            current = resolve_object_member_type(&current, segment)?;
        }

        Some(current)
    }

    fn resolve_type_operator_result(
        &self,
        operator: super::super::super::super::model::TypeOperatorKind,
        target: &TypeRef,
    ) -> Option<TypeRef> {
        match operator {
            super::super::super::super::model::TypeOperatorKind::Keyof => {
                let target = self.reduce_type_for_evaluation(target);
                let TypeRef::Object { members } = target else {
                    return None;
                };

                collapse_union(
                    members
                        .iter()
                        .map(|member| string_literal_type(&member.name))
                        .collect(),
                )
            }
            _ => None,
        }
    }

    fn resolve_indexed_access_result(&self, object: &TypeRef, index: &TypeRef) -> Option<TypeRef> {
        let object = self.reduce_type_for_evaluation(object);
        let index = self.reduce_type_for_evaluation(index);

        resolve_indexed_access(&object, &index)
            .map(|resolved| self.reduce_type_for_evaluation(&resolved))
    }

    fn resolve_template_literal_result(
        &self,
        parts: &[super::super::super::super::model::TemplateLiteralPart],
    ) -> Option<TypeRef> {
        let mut variants = vec![String::new()];

        for part in parts {
            let fragments = match part {
                super::super::super::super::model::TemplateLiteralPart::Text { value } => {
                    vec![value.clone()]
                }
                super::super::super::super::model::TemplateLiteralPart::Type { value } => {
                    self.literal_fragments_from_type(value)?
                }
            };

            let mut next_variants = Vec::new();
            for prefix in &variants {
                for fragment in &fragments {
                    next_variants.push(format!("{prefix}{fragment}"));
                }
            }
            variants = next_variants;
        }

        collapse_union(
            variants
                .into_iter()
                .map(|variant| string_literal_type(&variant))
                .collect(),
        )
    }

    fn resolve_conditional_result(
        &self,
        check_type: &TypeRef,
        extends_type: &TypeRef,
        true_type: &TypeRef,
        false_type: &TypeRef,
    ) -> Option<TypeRef> {
        let check_type = self.reduce_type_for_evaluation(check_type);
        let extends_type = self.reduce_type_for_evaluation(extends_type);

        if let TypeRef::Union { types } = &check_type {
            return collapse_union(
                types
                    .iter()
                    .filter_map(|item| {
                        self.resolve_conditional_result(
                            item,
                            &extends_type,
                            true_type,
                            false_type,
                        )
                    })
                    .collect(),
            );
        }

        let does_extend = type_extends(&check_type, &extends_type)?;
        let selected_branch = if does_extend { true_type } else { false_type };

        Some(self.reduce_type_for_evaluation(selected_branch))
    }

    pub(super) fn reduce_type_for_evaluation(&self, type_ref: &TypeRef) -> TypeRef {
        let mut visited = Vec::new();
        self.reduce_type_for_evaluation_inner(type_ref, &mut visited)
    }

    fn reduce_type_for_evaluation_inner(
        &self,
        type_ref: &TypeRef,
        visited: &mut Vec<String>,
    ) -> TypeRef {
        let current = resolved_or_self(type_ref);

        let Some(visit_key) = self.reference_visit_key(current) else {
            return current.clone();
        };
        if visited.contains(&visit_key) {
            return current.clone();
        }

        let Some(dereferenced) = self.dereference_local_reference(current) else {
            return current.clone();
        };

        visited.push(visit_key);
        let reduced = self.reduce_type_for_evaluation_inner(&dereferenced, visited);
        visited.pop();

        reduced
    }

    pub(super) fn dereference_local_reference(&self, type_ref: &TypeRef) -> Option<TypeRef> {
        let TypeRef::Reference {
            name,
            target_id,
            type_arguments,
            ..
        } = type_ref
        else {
            return None;
        };

        let symbol = self.lookup_local_symbol(target_id.as_deref(), name)?;
        match symbol.kind {
            TsSymbolKind::TypeAlias => {
                let underlying = symbol.underlying.as_ref()?;
                let instantiated =
                    self.instantiate_symbol_type_alias(symbol, underlying, type_arguments.as_deref());
                Some(self.resolve_type_ref(instantiated))
            }
            TsSymbolKind::Interface => Some(TypeRef::Object {
                members: symbol
                    .defined_members
                    .clone()
                    .into_iter()
                    .map(|member| self.resolve_member(member))
                    .collect(),
            }),
        }
    }

    fn lookup_local_symbol<'b>(
        &'b self,
        target_id: Option<&str>,
        name: &str,
    ) -> Option<&'b SymbolShell> {
        if let Some(target_id) = target_id {
            return self.parsed.exports.iter().find(|symbol| symbol.id == target_id);
        }

        self.parsed.exports.iter().find(|symbol| symbol.name == name)
    }

    fn reference_visit_key(&self, type_ref: &TypeRef) -> Option<String> {
        let TypeRef::Reference {
            name,
            target_id,
            type_arguments,
            ..
        } = type_ref
        else {
            return None;
        };

        let identity = target_id.clone().unwrap_or_else(|| name.clone());
        Some(format!("{identity}:{type_arguments:?}"))
    }

    fn instantiate_symbol_type_alias(
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

    fn literal_fragments_from_type(&self, type_ref: &TypeRef) -> Option<Vec<String>> {
        match self.reduce_type_for_evaluation(type_ref) {
            TypeRef::Literal { value } => Some(vec![literal_fragment(&value)?]),
            TypeRef::Union { types } => {
                let mut fragments = Vec::new();
                for item in types {
                    fragments.extend(self.literal_fragments_from_type(&item)?);
                }
                Some(fragments)
            }
            _ => None,
        }
    }
}

fn resolve_object_member_type(type_ref: &TypeRef, name: &str) -> Option<TypeRef> {
    let TypeRef::Object { members } = resolved_or_self(type_ref) else {
        return None;
    };

    members
        .iter()
        .find(|member| member.name == name)
        .and_then(|member| member.type_ref.clone())
}

fn resolved_or_self<'a>(type_ref: &'a TypeRef) -> &'a TypeRef {
    let mut current = type_ref;

    loop {
        match current {
            TypeRef::TypeQuery {
                resolved: Some(resolved),
                ..
            }
            | TypeRef::TypeOperator {
                resolved: Some(resolved),
                ..
            }
            | TypeRef::IndexedAccess {
                resolved: Some(resolved),
                ..
            }
            | TypeRef::Conditional {
                resolved: Some(resolved),
                ..
            }
            | TypeRef::TemplateLiteral {
                resolved: Some(resolved),
                ..
            } => {
                current = resolved.as_ref();
            }
            _ => return current,
        }
    }
}

fn resolve_indexed_access(object: &TypeRef, index: &TypeRef) -> Option<TypeRef> {
    match object {
        TypeRef::Object { members } => resolve_object_index(members, index),
        TypeRef::Tuple { elements } => resolve_tuple_index(elements, index),
        TypeRef::Array { element } => {
            if is_number_index(index) {
                Some(element.as_ref().clone())
            } else {
                None
            }
        }
        TypeRef::Union { types } => collapse_union(
            types
                .iter()
                .filter_map(|item| resolve_indexed_access(item, index))
                .collect(),
        ),
        _ => None,
    }
}

fn resolve_object_index(
    members: &[super::super::super::super::model::TsMember],
    index: &TypeRef,
) -> Option<TypeRef> {
    match index {
        TypeRef::Literal { value } => {
            let key = literal_key(value)?;
            members
                .iter()
                .find(|member| member.name == key)
                .and_then(|member| member.type_ref.clone())
        }
        TypeRef::Union { types } => collapse_union(
            types
                .iter()
                .filter_map(|item| resolve_object_index(members, item))
                .collect(),
        ),
        _ => None,
    }
}

fn resolve_tuple_index(elements: &[TupleElement], index: &TypeRef) -> Option<TypeRef> {
    match index {
        TypeRef::Literal { value } => {
            let index = parse_numeric_literal(value)?;
            elements.get(index).map(|element| element.element.clone())
        }
        TypeRef::Union { types } => collapse_union(
            types
                .iter()
                .filter_map(|item| resolve_tuple_index(elements, item))
                .collect(),
        ),
        _ if is_number_index(index) => collapse_union(
            elements
                .iter()
                .map(|element| element.element.clone())
                .collect(),
        ),
        _ => None,
    }
}

fn is_number_index(index: &TypeRef) -> bool {
    matches!(index, TypeRef::Intrinsic { name } if name == "number")
}

fn type_extends(check_type: &TypeRef, extends_type: &TypeRef) -> Option<bool> {
    match extends_type {
        TypeRef::Union { types } => {
            let results = types
                .iter()
                .map(|item| type_extends(check_type, item))
                .collect::<Option<Vec<_>>>()?;
            Some(results.into_iter().any(|result| result))
        }
        _ => match check_type {
            TypeRef::Union { types } => {
                let results = types
                    .iter()
                    .map(|item| type_extends(item, extends_type))
                    .collect::<Option<Vec<_>>>()?;
                Some(results.into_iter().all(|result| result))
            }
            TypeRef::Literal { value } => match extends_type {
                TypeRef::Literal {
                    value: extends_value,
                } => Some(value == extends_value),
                TypeRef::Intrinsic { name } => literal_matches_intrinsic(value, name),
                _ => Some(check_type == extends_type),
            },
            TypeRef::Intrinsic { name } => match extends_type {
                TypeRef::Intrinsic {
                    name: extends_name,
                } => Some(name == extends_name),
                _ => Some(check_type == extends_type),
            },
            _ => Some(check_type == extends_type),
        },
    }
}

fn literal_matches_intrinsic(value: &str, intrinsic_name: &str) -> Option<bool> {
    let trimmed = value.trim();
    match intrinsic_name {
        "string" => Some(is_wrapped_literal(trimmed)),
        "number" => Some(parse_numeric_literal(trimmed).is_some()),
        "boolean" => Some(trimmed == "true" || trimmed == "false"),
        _ => None,
    }
}

fn collapse_union(types: Vec<TypeRef>) -> Option<TypeRef> {
    let mut unique = Vec::new();

    for type_ref in types {
        if !unique.contains(&type_ref) {
            unique.push(type_ref);
        }
    }

    match unique.len() {
        0 => None,
        1 => unique.into_iter().next(),
        _ => Some(TypeRef::Union { types: unique }),
    }
}

fn string_literal_type(value: &str) -> TypeRef {
    TypeRef::Literal {
        value: format!("'{}'", value.replace('\\', "\\\\").replace('\'', "\\'")),
    }
}

fn literal_key(value: &str) -> Option<String> {
    let trimmed = value.trim();
    if is_wrapped_literal(trimmed) {
        return Some(trimmed[1..trimmed.len() - 1].to_string());
    }

    Some(trimmed.to_string())
}

fn parse_numeric_literal(value: &str) -> Option<usize> {
    let trimmed = value.trim();
    let normalized = if is_wrapped_literal(trimmed) {
        &trimmed[1..trimmed.len() - 1]
    } else {
        trimmed
    };
    normalized.parse::<usize>().ok()
}

fn literal_fragment(value: &str) -> Option<String> {
    let trimmed = value.trim();
    if is_wrapped_literal(trimmed) {
        return Some(trimmed[1..trimmed.len() - 1].to_string());
    }

    Some(trimmed.to_string())
}

fn is_wrapped_literal(value: &str) -> bool {
    value.len() >= 2
        && ((value.starts_with('\'') && value.ends_with('\''))
            || (value.starts_with('"') && value.ends_with('"'))
            || (value.starts_with('`') && value.ends_with('`')))
}

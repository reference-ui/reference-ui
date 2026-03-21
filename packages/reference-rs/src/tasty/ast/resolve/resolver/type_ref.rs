use super::super::super::super::model::{TupleElement, TypeRef};
use super::super::super::model::ImportBindingKind;
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
            } => TypeRef::Conditional {
                check_type: Box::new(self.resolve_type_ref(*check_type)),
                extends_type: Box::new(self.resolve_type_ref(*extends_type)),
                true_type: Box::new(self.resolve_type_ref(*true_type)),
                false_type: Box::new(self.resolve_type_ref(*false_type)),
            },
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
                let target = resolved_or_self(target);
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
        resolve_indexed_access(resolved_or_self(object), resolved_or_self(index))
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
                    literal_fragments_from_type(value)?
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

fn literal_fragments_from_type(type_ref: &TypeRef) -> Option<Vec<String>> {
    match resolved_or_self(type_ref) {
        TypeRef::Literal { value } => Some(vec![literal_fragment(value)?]),
        TypeRef::Union { types } => {
            let mut fragments = Vec::new();
            for item in types {
                fragments.extend(literal_fragments_from_type(item)?);
            }
            Some(fragments)
        }
        _ => None,
    }
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

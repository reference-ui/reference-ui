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
            TypeRef::IndexedAccess { object, index } => TypeRef::IndexedAccess {
                object: Box::new(self.resolve_type_ref(*object)),
                index: Box::new(self.resolve_type_ref(*index)),
            },
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
            TypeRef::TypeOperator { operator, target } => TypeRef::TypeOperator {
                operator,
                target: Box::new(self.resolve_type_ref(*target)),
            },
            TypeRef::TypeQuery { expression } => TypeRef::TypeQuery { expression },
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
            TypeRef::TemplateLiteral { parts } => TypeRef::TemplateLiteral {
                parts: parts
                    .into_iter()
                    .map(|part| self.resolve_template_literal_part(part))
                    .collect(),
            },
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
}

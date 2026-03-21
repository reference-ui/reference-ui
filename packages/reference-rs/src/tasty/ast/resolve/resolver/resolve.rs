use super::super::names::namespace_export_lookup_name;
use super::Resolver;
use crate::tasty::ast::model::ImportBindingKind;
use crate::tasty::model::{
    TemplateLiteralPart, TsTypeParameter, TupleElement, TypeOperatorKind, TypeRef,
};
use crate::tasty::shared::type_ref_map::{map_type_ref, TypeRefMap};
use crate::tasty::shared::typeref_util::reference_lookup_name;

impl<'a> Resolver<'a> {
    pub(super) fn resolve_type_ref(&self, type_ref: TypeRef) -> TypeRef {
        let mut mapper = ResolverTypeRefMap { resolver: self };
        map_type_ref(&mut mapper, type_ref)
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
            current =
                crate::tasty::shared::typeref_util::resolve_object_member_type(&current, segment)?;
        }

        Some(current)
    }
}

struct ResolverTypeRefMap<'a, 'b> {
    resolver: &'a Resolver<'b>,
}

impl TypeRefMap for ResolverTypeRefMap<'_, '_> {
    fn map_reference(
        &mut self,
        name: String,
        target_id: Option<String>,
        source_module: Option<String>,
        type_arguments: Option<Vec<TypeRef>>,
    ) -> TypeRef {
        self.resolver
            .resolve_reference(name, target_id, source_module, type_arguments)
    }

    fn map_indexed_access(
        &mut self,
        object: TypeRef,
        index: TypeRef,
        _resolved: Option<Box<TypeRef>>,
    ) -> TypeRef {
        let resolved = self
            .resolver
            .resolve_indexed_access_result(&object, &index)
            .map(Box::new);
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
        _resolved: Option<Box<TypeRef>>,
    ) -> TypeRef {
        let resolved = self
            .resolver
            .resolve_type_operator_result(operator, &target)
            .map(Box::new);
        TypeRef::TypeOperator {
            operator,
            target: Box::new(target),
            resolved,
        }
    }

    fn map_type_query(
        &mut self,
        expression: String,
        _resolved: Option<Box<TypeRef>>,
    ) -> TypeRef {
        TypeRef::TypeQuery {
            resolved: self
                .resolver
                .resolve_type_query_expression(&expression)
                .map(|resolved| Box::new(self.resolver.resolve_type_ref(resolved))),
            expression,
        }
    }

    fn map_conditional(
        &mut self,
        check_type: TypeRef,
        extends_type: TypeRef,
        true_type: TypeRef,
        false_type: TypeRef,
        _resolved: Option<Box<TypeRef>>,
    ) -> TypeRef {
        let resolved = self
            .resolver
            .resolve_conditional_result(
                &check_type,
                &extends_type,
                &true_type,
                &false_type,
            )
            .map(Box::new);
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
        _resolved: Option<Box<TypeRef>>,
    ) -> TypeRef {
        let resolved = self
            .resolver
            .resolve_template_literal_result(&parts)
            .map(Box::new);
        TypeRef::TemplateLiteral { parts, resolved }
    }

    fn map_type_parameter(&mut self, param: TsTypeParameter) -> TsTypeParameter {
        self.resolver.resolve_type_parameter(param)
    }

    fn map_tuple_element(&mut self, element: TupleElement) -> TupleElement {
        TupleElement {
            element: map_type_ref(self, element.element),
            ..element
        }
    }
}

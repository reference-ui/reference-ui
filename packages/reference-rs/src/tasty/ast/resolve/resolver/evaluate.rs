use super::Resolver;
use crate::tasty::ast::model::SymbolShell;
use crate::tasty::model::{TsSymbolKind, TypeRef};
use crate::tasty::shared::typeref_util::{
    collapse_union, literal_fragment, resolve_indexed_access, resolved_or_self,
    string_literal_type, type_extends,
};

impl<'a> Resolver<'a> {
    pub(super) fn resolve_type_operator_result(
        &self,
        operator: crate::tasty::model::TypeOperatorKind,
        target: &TypeRef,
    ) -> Option<TypeRef> {
        match operator {
            crate::tasty::model::TypeOperatorKind::Keyof => {
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

    pub(super) fn resolve_indexed_access_result(
        &self,
        object: &TypeRef,
        index: &TypeRef,
    ) -> Option<TypeRef> {
        let object = self.reduce_type_for_evaluation(object);
        let index = self.reduce_type_for_evaluation(index);

        resolve_indexed_access(&object, &index)
            .map(|resolved| self.reduce_type_for_evaluation(&resolved))
    }

    pub(super) fn resolve_template_literal_result(
        &self,
        parts: &[crate::tasty::model::TemplateLiteralPart],
    ) -> Option<TypeRef> {
        let mut variants = vec![String::new()];

        for part in parts {
            let fragments = match part {
                crate::tasty::model::TemplateLiteralPart::Text { value } => {
                    vec![value.clone()]
                }
                crate::tasty::model::TemplateLiteralPart::Type { value } => {
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

    pub(super) fn resolve_conditional_result(
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
                        self.resolve_conditional_result(item, &extends_type, true_type, false_type)
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
                let instantiated = self.instantiate_symbol_type_alias(
                    symbol,
                    underlying,
                    type_arguments.as_deref(),
                );
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
            return self
                .parsed
                .exports
                .iter()
                .find(|symbol| symbol.id == target_id);
        }

        self.parsed
            .exports
            .iter()
            .find(|symbol| symbol.name == name)
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

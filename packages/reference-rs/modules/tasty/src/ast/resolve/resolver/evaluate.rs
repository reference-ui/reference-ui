//! Type-level evaluation for the resolver: `keyof`, indexed access, template literal unions,
//! conditional types, and the alias expansion that feeds them. Each entry answers `None` for any
//! shape it cannot settle the way TypeScript does, which leaves the `resolved` field absent, and it
//! runs under the budgets in `shared::eval_budget` so recursive aliases end in that same fail-closed
//! answer instead of exhausting the native stack. Interfaces that `extends` another type or declare
//! type parameters are not expanded, because their inherited and substituted members are not modelled.

use super::Resolver;
use crate::ast::model::SymbolShell;
use crate::model::{TemplateLiteralPart, TsSymbolKind, TypeOperatorKind, TypeRef};
use crate::shared::eval_budget::{exhausted, AliasScope, EvaluationScope, InstantiationScope};
use crate::shared::literal_value::fragment_text;
use crate::shared::type_extends::conditional_decision;
use crate::shared::type_ref_util::{
    boolean_members, collapse_union_capped, cross_product, object_key_names, push_members,
    resolve_indexed_access, resolved_or_self, string_literal_type, union_members,
    MAX_EVALUATED_UNION_MEMBERS,
};

/// A result computed while a budget ran out is discarded, so no partial answer escapes.
fn settle<T>(value: Option<T>) -> Option<T> {
    if exhausted() {
        None
    } else {
        value
    }
}

impl<'a> Resolver<'a> {
    pub(super) fn resolve_type_operator_result(
        &self,
        operator: TypeOperatorKind,
        target: &TypeRef,
    ) -> Option<TypeRef> {
        let _scope = EvaluationScope::enter();
        match operator {
            TypeOperatorKind::Keyof => {
                let TypeRef::Object { members } = self.reduce_type_for_evaluation(target)? else {
                    return None;
                };
                let names = object_key_names(&members)?;
                settle(collapse_union_capped(
                    names.iter().map(|name| string_literal_type(name)).collect(),
                ))
            }
            _ => None,
        }
    }

    pub(super) fn resolve_indexed_access_result(
        &self,
        object: &TypeRef,
        index: &TypeRef,
    ) -> Option<TypeRef> {
        let _scope = EvaluationScope::enter();
        let object = self.reduce_type_for_evaluation(object)?;
        let index = self.reduce_type_for_evaluation(index)?;
        let resolved = resolve_indexed_access(&object, &index)?;

        settle(self.reduce_type_for_evaluation(&resolved))
    }

    pub(super) fn resolve_template_literal_result(
        &self,
        parts: &[TemplateLiteralPart],
    ) -> Option<TypeRef> {
        let _scope = EvaluationScope::enter();
        let mut variants = vec![String::new()];

        for part in parts {
            let fragments = self.template_part_fragments(part)?;
            variants = cross_product(&variants, &fragments)?;
        }

        settle(collapse_union_capped(
            variants
                .iter()
                .map(|variant| string_literal_type(variant))
                .collect(),
        ))
    }

    fn template_part_fragments(&self, part: &TemplateLiteralPart) -> Option<Vec<String>> {
        match part {
            // Escapes in template text are not decoded, so a text part with one fails closed.
            TemplateLiteralPart::Text { value } => {
                (!value.contains('\\')).then(|| vec![value.clone()])
            }
            TemplateLiteralPart::Type { value } => self.literal_fragments_from_type(value),
        }
    }

    pub(super) fn resolve_conditional_result(
        &self,
        check_type: &TypeRef,
        extends_type: &TypeRef,
        true_type: &TypeRef,
        false_type: &TypeRef,
    ) -> Option<TypeRef> {
        let _scope = EvaluationScope::enter();
        let check = self.reduce_type_for_evaluation(check_type)?;
        let extends = self.reduce_type_for_evaluation(extends_type)?;
        let does_extend = conditional_decision(&check, &extends)?;
        let selected_branch = if does_extend { true_type } else { false_type };

        settle(self.reduce_type_for_evaluation(selected_branch))
    }

    pub(super) fn reduce_type_for_evaluation(&self, type_ref: &TypeRef) -> Option<TypeRef> {
        let _scope = EvaluationScope::enter();
        let mut visited = Vec::new();
        settle(self.reduce_type_for_evaluation_inner(type_ref, &mut visited))
    }

    /// Follows alias and interface references until a structural type remains. `None` means the
    /// chain is circular or a budget ran out; an unknown name stays as the reference it is.
    fn reduce_type_for_evaluation_inner(
        &self,
        type_ref: &TypeRef,
        visited: &mut Vec<String>,
    ) -> Option<TypeRef> {
        let current = resolved_or_self(type_ref);

        let Some(visit_key) = self.reference_visit_key(current) else {
            return Some(current.clone());
        };
        if visited.contains(&visit_key) {
            return None;
        }

        let Some(dereferenced) = self.dereference_local_reference(current) else {
            return Some(current.clone());
        };

        visited.push(visit_key);
        let reduced = self.reduce_type_for_evaluation_inner(&dereferenced, visited);
        visited.pop();

        reduced
    }

    pub(super) fn dereference_local_reference(&self, type_ref: &TypeRef) -> Option<TypeRef> {
        let _scope = EvaluationScope::enter();
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
        let _expansion = AliasScope::enter()?;
        let expanded = match symbol.kind {
            TsSymbolKind::TypeAlias => self.expand_type_alias(symbol, type_arguments.as_deref()),
            TsSymbolKind::Interface => self.expand_interface(symbol),
        };

        settle(expanded)
    }

    fn expand_type_alias(
        &self,
        symbol: &SymbolShell,
        type_arguments: Option<&[TypeRef]>,
    ) -> Option<TypeRef> {
        let underlying = symbol.underlying.as_ref()?;
        if symbol.type_parameters.is_empty() {
            return Some(self.resolve_type_ref(underlying.clone()));
        }

        let _instantiation = InstantiationScope::enter();
        if let Some(distributed) = self.distribute_conditional(symbol, underlying, type_arguments) {
            return Some(distributed);
        }
        let instantiated = self.instantiate_symbol_type_alias(symbol, underlying, type_arguments);
        Some(self.resolve_type_ref(instantiated))
    }

    /// An interface with `extends` or type parameters is opaque here: its inherited or substituted
    /// members would be missing, and a partial member set answers `keyof` and indexed access wrongly.
    fn expand_interface(&self, symbol: &SymbolShell) -> Option<TypeRef> {
        if !symbol.extends.is_empty() || !symbol.type_parameters.is_empty() {
            return None;
        }

        Some(TypeRef::Object {
            members: symbol
                .defined_members
                .iter()
                .map(|member| self.resolve_member(member.clone()))
                .collect(),
        })
    }

    /// `Alias<U>` whose body is `P extends X ? A : B`, with `P` a naked type parameter and a union
    /// argument, distributes over the union members as TypeScript does. Each member is decided on
    /// its own and the results join under the conditional node. Other shapes return `None`.
    fn distribute_conditional(
        &self,
        symbol: &SymbolShell,
        underlying: &TypeRef,
        type_arguments: Option<&[TypeRef]>,
    ) -> Option<TypeRef> {
        let position = naked_check_position(symbol, underlying)?;
        let arguments = type_arguments?;
        let members = self.distributed_members(arguments.get(position)?)?;
        let variants: Vec<Vec<TypeRef>> = members
            .into_iter()
            .map(|member| {
                let mut variant = arguments.to_vec();
                variant[position] = member;
                variant
            })
            .collect();
        let results = self.member_results(symbol, underlying, &variants)?;

        let TypeRef::Conditional {
            check_type,
            extends_type,
            true_type,
            false_type,
            ..
        } = self.resolve_instantiation(symbol, underlying, arguments)
        else {
            return None;
        };

        Some(TypeRef::Conditional {
            check_type,
            extends_type,
            true_type,
            false_type,
            resolved: Some(Box::new(collapse_union_capped(results)?)),
        })
    }

    /// Decides the alias body once for each argument list, one per union member.
    fn member_results(
        &self,
        symbol: &SymbolShell,
        underlying: &TypeRef,
        variants: &[Vec<TypeRef>],
    ) -> Option<Vec<TypeRef>> {
        let mut results = Vec::new();
        for variant in variants {
            match self.resolve_instantiation(symbol, underlying, variant) {
                TypeRef::Conditional {
                    resolved: Some(value),
                    ..
                } => push_members(&mut results, *value),
                _ => return None,
            }
        }
        Some(results)
    }

    fn resolve_instantiation(
        &self,
        symbol: &SymbolShell,
        underlying: &TypeRef,
        arguments: &[TypeRef],
    ) -> TypeRef {
        let instantiated = self.instantiate_symbol_type_alias(symbol, underlying, Some(arguments));
        self.resolve_type_ref(instantiated)
    }

    /// The members a distributive conditional runs over. `boolean` is `true | false` in TypeScript.
    /// A single concrete argument returns `None`, because the ordinary path already decides it, and
    /// a union past the member cap fails closed rather than instantiating the body once per member.
    fn distributed_members(&self, argument: &TypeRef) -> Option<Vec<TypeRef>> {
        match self.reduce_type_for_evaluation(argument)? {
            TypeRef::Union { types } => union_members(types),
            TypeRef::Intrinsic { name } if name == "boolean" => Some(boolean_members()),
            _ => None,
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
        match self.reduce_type_for_evaluation(type_ref)? {
            TypeRef::Literal { value } => Some(vec![fragment_text(&value)?]),
            TypeRef::Union { types } => self.union_fragments(&types),
            _ => None,
        }
    }

    fn union_fragments(&self, types: &[TypeRef]) -> Option<Vec<String>> {
        let mut fragments = Vec::new();
        for item in types {
            fragments.extend(self.literal_fragments_from_type(item)?);
        }
        (fragments.len() <= MAX_EVALUATED_UNION_MEMBERS).then_some(fragments)
    }
}

/// The index of the type parameter that is the naked check type of a conditional alias body.
fn naked_check_position(symbol: &SymbolShell, underlying: &TypeRef) -> Option<usize> {
    let TypeRef::Conditional { check_type, .. } = underlying else {
        return None;
    };
    let TypeRef::Reference {
        name,
        target_id: None,
        source_module: None,
        type_arguments: None,
    } = check_type.as_ref()
    else {
        return None;
    };

    symbol
        .type_parameters
        .iter()
        .position(|parameter| &parameter.name == name)
}

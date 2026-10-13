//! Resolves one symbol's own parts: its `extends`, underlying type, members, references, and type parameters.
//! Every part resolves with the symbol's own type-parameter names bound, so a same-named top-level symbol never
//! captures them, and then `binders.rs` clears the binder marks so the resolved symbol carries none. Evaluation
//! reaches `resolve_member` and `resolve_type_ref` with no binders, because it resolves another declaration's types.

use super::binders::clear_binder_targets;
use super::Resolver;
use crate::ast::model::SymbolShell;
use crate::model::{TsMember, TsSymbol, TsSymbolKind, TsTypeParameter, TypeRef};

impl<'a> Resolver<'a> {
    pub(in super::super) fn resolve_symbol(self, mut symbol: SymbolShell) -> TsSymbol {
        let symbol_kind = symbol.kind.clone();
        let binders: Vec<String> = symbol
            .type_parameters
            .iter()
            .map(|param| param.name.clone())
            .collect();

        symbol.extends = symbol
            .extends
            .into_iter()
            .map(|type_ref| self.settle(type_ref, &binders))
            .collect();
        symbol.underlying = symbol.underlying.map(|type_ref| {
            clear_binder_targets(self.resolve_symbol_underlying(
                symbol_kind.clone(),
                type_ref,
                &binders,
            ))
        });
        symbol.defined_members = symbol
            .defined_members
            .into_iter()
            .map(|member| self.settle_member(member, &binders))
            .collect();
        symbol.references = symbol
            .references
            .into_iter()
            .map(|type_ref| self.settle(type_ref, &binders))
            .collect();

        let type_parameters = symbol
            .type_parameters
            .into_iter()
            .map(|param| self.settle_type_parameter(param, &binders))
            .collect();

        TsSymbol {
            id: symbol.id,
            name: symbol.name,
            library: self.parsed.library.clone(),
            kind: symbol.kind,
            file_id: self.parsed.file_id.clone(),
            exported: symbol.exported,
            description: symbol.description,
            description_raw: symbol.description_raw,
            jsdoc: symbol.jsdoc,
            type_parameters,
            defined_members: symbol.defined_members,
            extends: symbol.extends,
            underlying: symbol.underlying,
            references: symbol.references,
        }
    }

    pub(super) fn resolve_member(&self, member: TsMember) -> TsMember {
        TsMember {
            type_ref: member
                .type_ref
                .map(|type_ref| self.resolve_type_ref(type_ref)),
            ..member
        }
    }

    /// Resolves one of the symbol's own types and clears its binder marks.
    fn settle(&self, type_ref: TypeRef, binders: &[String]) -> TypeRef {
        clear_binder_targets(self.resolve_type_ref_in(type_ref, binders))
    }

    fn settle_member(&self, member: TsMember, binders: &[String]) -> TsMember {
        TsMember {
            type_ref: member
                .type_ref
                .map(|type_ref| self.settle(type_ref, binders)),
            ..member
        }
    }

    fn settle_type_parameter(&self, param: TsTypeParameter, binders: &[String]) -> TsTypeParameter {
        TsTypeParameter {
            name: param.name,
            constraint: param.constraint.map(|t| self.settle(t, binders)),
            default: param.default.map(|t| self.settle(t, binders)),
        }
    }

    fn resolve_symbol_underlying(
        &self,
        symbol_kind: TsSymbolKind,
        type_ref: TypeRef,
        binders: &[String],
    ) -> TypeRef {
        let resolved = self.resolve_type_ref_in(type_ref, binders);

        if symbol_kind != TsSymbolKind::TypeAlias {
            return resolved;
        }

        match &resolved {
            TypeRef::Reference {
                type_arguments: Some(_),
                ..
            } => self
                .dereference_local_reference(&resolved)
                .unwrap_or(resolved),
            _ => resolved,
        }
    }
}

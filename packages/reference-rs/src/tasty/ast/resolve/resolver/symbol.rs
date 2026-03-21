use crate::tasty::ast::model::SymbolShell;
use crate::tasty::model::{
    FnParam, TemplateLiteralPart, TsMember, TsSymbol, TsSymbolKind, TsTypeParameter, TypeRef,
};
use super::Resolver;

impl<'a> Resolver<'a> {
    pub(in super::super) fn resolve_symbol(self, mut symbol: SymbolShell) -> TsSymbol {
        let symbol_kind = symbol.kind.clone();
        symbol.extends = symbol
            .extends
            .into_iter()
            .map(|type_ref| self.resolve_type_ref(type_ref))
            .collect();
        symbol.underlying = symbol
            .underlying
            .map(|type_ref| self.resolve_symbol_underlying(symbol_kind.clone(), type_ref));
        symbol.defined_members = symbol
            .defined_members
            .into_iter()
            .map(|member| self.resolve_member(member))
            .collect();
        symbol.references = symbol
            .references
            .into_iter()
            .map(|type_ref| self.resolve_type_ref(type_ref))
            .collect();

        let type_parameters = symbol
            .type_parameters
            .into_iter()
            .map(|param| self.resolve_type_parameter(param))
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

    pub(super) fn resolve_type_parameter(&self, param: TsTypeParameter) -> TsTypeParameter {
        TsTypeParameter {
            name: param.name,
            constraint: param.constraint.map(|t| self.resolve_type_ref(t)),
            default: param.default.map(|t| self.resolve_type_ref(t)),
        }
    }

    pub(super) fn resolve_fn_param(&self, param: FnParam) -> FnParam {
        FnParam {
            type_ref: param
                .type_ref
                .map(|type_ref| self.resolve_type_ref(type_ref)),
            ..param
        }
    }

    fn resolve_symbol_underlying(&self, symbol_kind: TsSymbolKind, type_ref: TypeRef) -> TypeRef {
        let resolved = self.resolve_type_ref(type_ref);

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

    pub(super) fn resolve_template_literal_part(
        &self,
        part: TemplateLiteralPart,
    ) -> TemplateLiteralPart {
        match part {
            TemplateLiteralPart::Text { value } => TemplateLiteralPart::Text { value },
            TemplateLiteralPart::Type { value } => TemplateLiteralPart::Type {
                value: self.resolve_type_ref(value),
            },
        }
    }
}

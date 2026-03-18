use super::super::super::super::model::{
    FnParam, TemplateLiteralPart, TsMember, TsSymbol, TsTypeParameter,
};
use super::super::super::model::SymbolShell;
use super::Resolver;

impl<'a> Resolver<'a> {
    pub(in super::super) fn resolve_symbol(self, mut symbol: SymbolShell) -> TsSymbol {
        symbol.extends = symbol
            .extends
            .into_iter()
            .map(|type_ref| self.resolve_type_ref(type_ref))
            .collect();
        symbol.underlying = symbol
            .underlying
            .map(|type_ref| self.resolve_type_ref(type_ref));
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

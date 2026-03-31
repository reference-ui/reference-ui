use oxc_ast::ast::{TSType, TSTypeParameterDeclaration};

use crate::tasty::constants::libraries::USER_LIBRARY_NAME;
use crate::tasty::shared::type_ref_util::reference_lookup_name;

use crate::tasty::ast::extract::ExtractionContext;
use super::slice_span;
use crate::tasty::model::{MappedModifierKind, TsTypeParameter, TypeRef};
use oxc_span::GetSpan;

mod lower_composites;
mod lower_keywords;
mod lower_references;

struct LoweringContext<'a> {
    ctx: &'a ExtractionContext<'a>,
}

impl<'a> LoweringContext<'a> {
    fn new(ctx: &'a ExtractionContext<'a>) -> Self {
        Self { ctx }
    }

    pub(super) fn lower_type_parameters<'b>(
        &self,
        decl: Option<&TSTypeParameterDeclaration<'b>>,
    ) -> Vec<TsTypeParameter> {
        let Some(decl) = decl else {
            return Vec::new();
        };

        decl.params
            .iter()
            .map(|param| TsTypeParameter {
                name: slice_span(self.ctx.source, param.name.span()).to_string(),
                constraint: param
                    .constraint
                    .as_ref()
                    .map(|constraint| self.lower_type(constraint)),
                default: param
                    .default
                    .as_ref()
                    .map(|default| self.lower_type(default)),
            })
            .collect()
    }

    pub(super) fn lower_type(&self, type_annotation: &TSType<'_>) -> TypeRef {
        if let Some(intrinsic) = self.lower_keyword_type(type_annotation) {
            return intrinsic;
        }

        match type_annotation {
            TSType::TSIntrinsicKeyword(keyword) => self.lower_intrinsic_keyword(keyword),
            TSType::TSLiteralType(literal) => self.lower_literal_type(literal),
            TSType::TSUnionType(union) => TypeRef::Union {
                types: self.lower_type_list(&union.types),
            },
            TSType::TSArrayType(array_type) => self.lower_array_type(array_type),
            TSType::TSTupleType(tuple_type) => self.lower_tuple_type(tuple_type),
            TSType::TSIntersectionType(intersection) => TypeRef::Intersection {
                types: self.lower_type_list(&intersection.types),
            },
            TSType::TSTypeLiteral(type_literal) => self.lower_type_literal(type_literal),
            TSType::TSParenthesizedType(parenthesized) => {
                self.lower_type(&parenthesized.type_annotation)
            }
            TSType::TSTypeReference(reference) => self.lower_type_reference(reference),
            TSType::TSNamedTupleMember(named) => self.lower_named_tuple_member_type(named),
            TSType::TSIndexedAccessType(indexed_access) => {
                self.lower_indexed_access_type(indexed_access)
            }
            TSType::TSImportType(_) | TSType::TSInferType(_) => self.raw_type(type_annotation),
            TSType::TSFunctionType(function_type) => self.lower_function_type(function_type),
            TSType::TSConstructorType(constructor_type) => {
                self.lower_constructor_type(constructor_type)
            }
            TSType::TSTypeOperatorType(operator) => self.lower_type_operator_type(operator),
            TSType::TSTypeQuery(query) => self.lower_type_query(query),
            TSType::TSConditionalType(conditional) => self.lower_conditional_type(conditional),
            TSType::TSMappedType(mapped) => self.lower_mapped_type(mapped),
            TSType::TSTemplateLiteralType(template) => self.lower_template_literal_type(template),
            TSType::TSTypePredicate(_) | TSType::TSThisType(_) => self.raw_type(type_annotation),
            TSType::JSDocNullableType(_)
            | TSType::JSDocNonNullableType(_)
            | TSType::JSDocUnknownType(_) => self.raw_type(type_annotation),
            TSType::TSStringKeyword(_)
            | TSType::TSNumberKeyword(_)
            | TSType::TSBooleanKeyword(_)
            | TSType::TSUnknownKeyword(_)
            | TSType::TSAnyKeyword(_)
            | TSType::TSUndefinedKeyword(_)
            | TSType::TSNullKeyword(_)
            | TSType::TSObjectKeyword(_)
            | TSType::TSBigIntKeyword(_)
            | TSType::TSSymbolKeyword(_)
            | TSType::TSNeverKeyword(_)
            | TSType::TSVoidKeyword(_) => {
                unreachable!("keyword types handled in lower_keyword_type")
            }
        }
    }

    pub(super) fn lower_type_list(&self, types: &[TSType<'_>]) -> Vec<TypeRef> {
        types.iter().map(|nested| self.lower_type(nested)).collect()
    }

    pub(super) fn raw_type(&self, type_annotation: &TSType<'_>) -> TypeRef {
        raw_type(type_annotation, self.ctx.source)
    }
}

pub(super) fn type_parameters_from_oxc<'a>(
    decl: Option<&TSTypeParameterDeclaration<'a>>,
    ctx: &ExtractionContext<'_>,
) -> Vec<TsTypeParameter> {
    LoweringContext::new(ctx).lower_type_parameters(decl)
}

pub(super) fn type_to_ref(type_annotation: &TSType<'_>, ctx: &ExtractionContext<'_>) -> TypeRef {
    LoweringContext::new(ctx).lower_type(type_annotation)
}

pub(super) fn interface_heritage_to_reference(
    heritage: &oxc_ast::ast::TSInterfaceHeritage<'_>,
    ctx: &ExtractionContext<'_>,
) -> TypeRef {
    LoweringContext::new(ctx).lower_interface_heritage(heritage)
}

fn mapped_modifier_kind(
    modifier: Option<oxc_ast::ast::TSMappedTypeModifierOperator>,
) -> MappedModifierKind {
    match modifier {
        None => MappedModifierKind::Preserve,
        Some(oxc_ast::ast::TSMappedTypeModifierOperator::True)
        | Some(oxc_ast::ast::TSMappedTypeModifierOperator::Plus) => MappedModifierKind::Add,
        Some(oxc_ast::ast::TSMappedTypeModifierOperator::Minus) => MappedModifierKind::Remove,
    }
}

fn reference_source_module(reference_name: &str, ctx: &ExtractionContext<'_>) -> Option<String> {
    let lookup_name = reference_lookup_name(reference_name);

    ctx.import_bindings
        .get(lookup_name)
        .map(|binding| binding.source_module.clone())
        .or_else(|| {
            if ctx.library == USER_LIBRARY_NAME {
                None
            } else {
                Some(ctx.module_specifier.to_string())
            }
        })
}

fn intrinsic(name: &str) -> TypeRef {
    TypeRef::Intrinsic {
        name: name.to_string(),
    }
}

fn raw_type(type_annotation: &TSType<'_>, source: &str) -> TypeRef {
    TypeRef::Raw {
        summary: slice_span(source, type_annotation.span()).to_string(),
    }
}

use std::collections::BTreeMap;

use oxc_ast::ast::{Expression, TSType, TSTypeParameterDeclaration};

use crate::tasty::constants::libraries::USER_LIBRARY_NAME;
use crate::tasty::shared::typeref_util::reference_lookup_name;

use crate::tasty::ast::model::ImportBinding;
use crate::tasty::model::{MappedModifierKind, TsTypeParameter, TypeRef};
use oxc_span::GetSpan;
use super::slice_span;

mod lower_keywords;
mod lower_composites;
mod lower_references;

struct LoweringContext<'a> {
    source: &'a str,
    import_bindings: &'a BTreeMap<String, ImportBinding>,
    current_module_specifier: &'a str,
    current_library: &'a str,
}

impl<'a> LoweringContext<'a> {
    fn new(
        source: &'a str,
        import_bindings: &'a BTreeMap<String, ImportBinding>,
        current_module_specifier: &'a str,
        current_library: &'a str,
    ) -> Self {
        Self {
            source,
            import_bindings,
            current_module_specifier,
            current_library,
        }
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
                name: slice_span(self.source, param.name.span()).to_string(),
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
        raw_type(type_annotation, self.source)
    }
}

pub(super) fn type_parameters_from_oxc<'a>(
    decl: Option<&TSTypeParameterDeclaration<'a>>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> Vec<TsTypeParameter> {
    LoweringContext::new(
        source,
        import_bindings,
        current_module_specifier,
        current_library,
    )
    .lower_type_parameters(decl)
}

pub(super) fn type_to_ref(
    type_annotation: &TSType<'_>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> TypeRef {
    LoweringContext::new(
        source,
        import_bindings,
        current_module_specifier,
        current_library,
    )
    .lower_type(type_annotation)
}

pub(super) fn expression_to_reference(
    expression: &Expression<'_>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> TypeRef {
    LoweringContext::new(
        source,
        import_bindings,
        current_module_specifier,
        current_library,
    )
    .lower_expression_reference(expression)
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

fn reference_source_module(
    reference_name: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> Option<String> {
    let lookup_name = reference_lookup_name(reference_name);

    import_bindings
        .get(lookup_name)
        .map(|binding| binding.source_module.clone())
        .or_else(|| {
            if current_library == USER_LIBRARY_NAME {
                None
            } else {
                Some(current_module_specifier.to_string())
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

use std::collections::BTreeMap;

use oxc_allocator::Allocator;
use oxc_ast::ast::{
    Expression, FormalParameters, TSTupleElement, TSType, TSTypeParameterDeclaration,
};
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType};

use super::super::super::model::{
    FnParam, MappedModifierKind, TemplateLiteralPart, TsTypeParameter, TupleElement, TypeOperatorKind,
    TypeRef,
};
use super::super::model::ImportBinding;
use super::members::members_from_signatures;
use super::slice_span;

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

    fn lower_type_parameters<'b>(
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

    fn lower_type(&self, type_annotation: &TSType<'_>) -> TypeRef {
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

    fn lower_keyword_type(&self, type_annotation: &TSType<'_>) -> Option<TypeRef> {
        let name = match type_annotation {
            TSType::TSStringKeyword(_) => "string",
            TSType::TSNumberKeyword(_) => "number",
            TSType::TSBooleanKeyword(_) => "boolean",
            TSType::TSUnknownKeyword(_) => "unknown",
            TSType::TSAnyKeyword(_) => "any",
            TSType::TSUndefinedKeyword(_) => "undefined",
            TSType::TSNullKeyword(_) => "null",
            TSType::TSObjectKeyword(_) => "object",
            TSType::TSBigIntKeyword(_) => "bigint",
            TSType::TSSymbolKeyword(_) => "symbol",
            TSType::TSNeverKeyword(_) => "never",
            TSType::TSVoidKeyword(_) => "void",
            _ => return None,
        };

        Some(intrinsic(name))
    }

    fn lower_intrinsic_keyword(&self, keyword: &oxc_ast::ast::TSIntrinsicKeyword) -> TypeRef {
        TypeRef::Intrinsic {
            name: slice_span(self.source, keyword.span()).to_string(),
        }
    }

    fn lower_literal_type(&self, literal: &oxc_ast::ast::TSLiteralType<'_>) -> TypeRef {
        TypeRef::Literal {
            value: slice_span(self.source, literal.span).to_string(),
        }
    }

    fn lower_type_list(&self, types: &[TSType<'_>]) -> Vec<TypeRef> {
        types.iter().map(|nested| self.lower_type(nested)).collect()
    }

    fn lower_array_type(&self, array_type: &oxc_ast::ast::TSArrayType<'_>) -> TypeRef {
        TypeRef::Array {
            element: Box::new(self.lower_type(&array_type.element_type)),
        }
    }

    fn lower_tuple_type(&self, tuple_type: &oxc_ast::ast::TSTupleType<'_>) -> TypeRef {
        TypeRef::Tuple {
            elements: tuple_type
                .element_types
                .iter()
                .map(|element| self.lower_tuple_element(element))
                .collect(),
        }
    }

    fn lower_type_literal(&self, type_literal: &oxc_ast::ast::TSTypeLiteral<'_>) -> TypeRef {
        TypeRef::Object {
            members: members_from_signatures(
                type_literal.members.as_slice(),
                self.source,
                &[],
                None,
                self.import_bindings,
                self.current_module_specifier,
                self.current_library,
            ),
        }
    }

    fn lower_named_tuple_member_type(
        &self,
        named: &oxc_ast::ast::TSNamedTupleMember<'_>,
    ) -> TypeRef {
        let inner = self.lower_tuple_element(&named.element_type);
        TypeRef::Tuple {
            elements: vec![TupleElement {
                label: Some(slice_span(self.source, named.label.span()).to_string()),
                optional: named.optional,
                rest: false,
                element: inner.element,
            }],
        }
    }

    fn lower_indexed_access_type(
        &self,
        indexed_access: &oxc_ast::ast::TSIndexedAccessType<'_>,
    ) -> TypeRef {
        TypeRef::IndexedAccess {
            object: Box::new(self.lower_type(&indexed_access.object_type)),
            index: Box::new(self.lower_type(&indexed_access.index_type)),
        }
    }

    fn lower_function_type(&self, function_type: &oxc_ast::ast::TSFunctionType<'_>) -> TypeRef {
        TypeRef::Function {
            params: self.lower_fn_params(&function_type.params),
            return_type: Box::new(self.lower_type(&function_type.return_type.type_annotation)),
        }
    }

    fn lower_constructor_type(
        &self,
        constructor_type: &oxc_ast::ast::TSConstructorType<'_>,
    ) -> TypeRef {
        TypeRef::Constructor {
            r#abstract: constructor_type.r#abstract,
            type_parameters: self
                .lower_type_parameters(constructor_type.type_parameters.as_deref()),
            params: self.lower_fn_params(&constructor_type.params),
            return_type: Box::new(self.lower_type(&constructor_type.return_type.type_annotation)),
        }
    }

    fn lower_type_operator_type(&self, operator: &oxc_ast::ast::TSTypeOperator<'_>) -> TypeRef {
        TypeRef::TypeOperator {
            operator: match operator.operator {
                oxc_ast::ast::TSTypeOperatorOperator::Keyof => TypeOperatorKind::Keyof,
                oxc_ast::ast::TSTypeOperatorOperator::Readonly => TypeOperatorKind::Readonly,
                oxc_ast::ast::TSTypeOperatorOperator::Unique => TypeOperatorKind::Unique,
            },
            target: Box::new(self.lower_type(&operator.type_annotation)),
        }
    }

    fn lower_type_query(&self, query: &oxc_ast::ast::TSTypeQuery<'_>) -> TypeRef {
        TypeRef::TypeQuery {
            expression: slice_span(self.source, query.expr_name.span()).to_string(),
        }
    }

    fn lower_conditional_type(&self, conditional: &oxc_ast::ast::TSConditionalType<'_>) -> TypeRef {
        TypeRef::Conditional {
            check_type: Box::new(self.lower_type(&conditional.check_type)),
            extends_type: Box::new(self.lower_type(&conditional.extends_type)),
            true_type: Box::new(self.lower_type(&conditional.true_type)),
            false_type: Box::new(self.lower_type(&conditional.false_type)),
        }
    }

    fn lower_mapped_type(&self, mapped: &oxc_ast::ast::TSMappedType<'_>) -> TypeRef {
        TypeRef::Mapped {
            type_param: slice_span(self.source, mapped.key.span()).to_string(),
            source_type: Box::new(self.lower_type(&mapped.constraint)),
            name_type: mapped
                .name_type
                .as_ref()
                .map(|name_type| Box::new(self.lower_type(name_type))),
            optional_modifier: mapped_modifier_kind(mapped.optional),
            readonly_modifier: mapped_modifier_kind(mapped.readonly),
            value_type: mapped
                .type_annotation
                .as_ref()
                .map(|value_type| Box::new(self.lower_type(value_type))),
        }
    }

    fn lower_template_literal_type(
        &self,
        template: &oxc_ast::ast::TSTemplateLiteralType<'_>,
    ) -> TypeRef {
        TypeRef::TemplateLiteral {
            parts: self.lower_template_literal_parts(template),
        }
    }

    fn lower_type_reference(&self, reference: &oxc_ast::ast::TSTypeReference<'_>) -> TypeRef {
        let name = slice_span(self.source, reference.type_name.span()).to_string();
        let lookup_name = reference_lookup_name(&name);
        let type_arguments = reference.type_arguments.as_ref().map(|instantiation| {
            instantiation
                .params
                .iter()
                .map(|argument| self.lower_type(argument))
                .collect::<Vec<_>>()
        });

        if lookup_name == "Array" {
            if let Some([element]) = type_arguments.as_deref() {
                return TypeRef::Array {
                    element: Box::new(element.clone()),
                };
            }
        }

        let source_module = self.reference_source_module(&name);
        TypeRef::Reference {
            name,
            target_id: None,
            source_module,
            type_arguments,
        }
    }

    fn lower_expression_reference(&self, expression: &Expression<'_>) -> TypeRef {
        let name = slice_span(self.source, expression.span()).to_string();

        TypeRef::Reference {
            name: name.clone(),
            target_id: None,
            source_module: self.reference_source_module(&name),
            type_arguments: None,
        }
    }

    fn lower_tuple_element(&self, element: &TSTupleElement<'_>) -> TupleElement {
        match element {
            TSTupleElement::TSOptionalType(optional) => TupleElement {
                label: None,
                optional: true,
                rest: false,
                element: self.lower_type(&optional.type_annotation),
            },
            TSTupleElement::TSRestType(rest) => TupleElement {
                label: None,
                optional: false,
                rest: true,
                element: self.lower_type(&rest.type_annotation),
            },
            TSTupleElement::TSNamedTupleMember(named) => {
                let lowered = self.lower_tuple_element(&named.element_type);

                TupleElement {
                    label: Some(slice_span(self.source, named.label.span()).to_string()),
                    optional: named.optional,
                    rest: false,
                    element: lowered.element,
                }
            }
            _ => TupleElement {
                label: None,
                optional: false,
                rest: false,
                element: self.lower_tuple_element_type(element),
            },
        }
    }

    fn lower_tuple_element_type(&self, element: &TSTupleElement<'_>) -> TypeRef {
        let element_source = slice_span(self.source, element.span());
        let wrapped_source = format!("type __TastyTupleElement = {element_source};");
        let allocator = Allocator::default();
        let source_type = SourceType::from_path("tuple-element.ts").unwrap_or_default();
        let parse_result = Parser::new(&allocator, &wrapped_source, source_type).parse();

        // Reparse a single tuple element through a synthetic alias so we can reuse
        // the normal type-lowering path without special-casing every tuple variant.
        if let Some(oxc_ast::ast::Statement::TSTypeAliasDeclaration(type_alias)) =
            parse_result.program.body.first()
        {
            return LoweringContext::new(
                &wrapped_source,
                self.import_bindings,
                self.current_module_specifier,
                self.current_library,
            )
            .lower_type(&type_alias.type_annotation);
        }

        TypeRef::Raw {
            summary: element_source.to_string(),
        }
    }

    fn lower_fn_params(&self, params: &FormalParameters<'_>) -> Vec<FnParam> {
        let mut lowered_params =
            Vec::with_capacity(params.items.len() + params.rest.as_ref().map(|_| 1).unwrap_or(0));

        for param in &params.items {
            lowered_params.push(FnParam {
                name: Some(slice_span(self.source, param.pattern.span()).to_string()),
                optional: param.optional,
                type_ref: param
                    .type_annotation
                    .as_ref()
                    .map(|annotation| self.lower_type(&annotation.type_annotation)),
            });
        }

        if let Some(rest) = &params.rest {
            lowered_params.push(FnParam {
                name: Some(slice_span(self.source, rest.rest.span()).to_string()),
                optional: false,
                type_ref: rest
                    .type_annotation
                    .as_ref()
                    .map(|annotation| self.lower_type(&annotation.type_annotation)),
            });
        }

        lowered_params
    }

    fn lower_template_literal_parts(
        &self,
        template: &oxc_ast::ast::TSTemplateLiteralType<'_>,
    ) -> Vec<TemplateLiteralPart> {
        let mut parts = Vec::with_capacity(template.quasis.len() + template.types.len());

        for (index, quasi) in template.quasis.iter().enumerate() {
            parts.push(TemplateLiteralPart::Text {
                value: quasi.value.raw.as_str().to_string(),
            });

            if let Some(type_part) = template.types.get(index) {
                parts.push(TemplateLiteralPart::Type {
                    value: self.lower_type(type_part),
                });
            }
        }

        parts
    }

    fn reference_source_module(&self, reference_name: &str) -> Option<String> {
        reference_source_module(
            reference_name,
            self.import_bindings,
            self.current_module_specifier,
            self.current_library,
        )
    }

    fn raw_type(&self, type_annotation: &TSType<'_>) -> TypeRef {
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
            if current_library == "user" {
                None
            } else {
                Some(current_module_specifier.to_string())
            }
        })
}

fn reference_lookup_name(reference_name: &str) -> &str {
    reference_name
        .split(['.', '<'])
        .next()
        .unwrap_or(reference_name)
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

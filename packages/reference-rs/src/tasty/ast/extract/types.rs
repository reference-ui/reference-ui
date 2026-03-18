use std::collections::BTreeMap;

use oxc_allocator::Allocator;
use oxc_ast::ast::{
    Expression, FormalParameters, TSType, TSTypeParameterDeclaration, TSTupleElement,
};
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType};

use super::members::members_from_signatures;
use super::super::super::model::{
    FnParam, MappedModifierKind, TemplateLiteralPart, TsMember, TsTypeParameter, TupleElement,
    TypeOperatorKind, TypeRef,
};
use super::super::model::ImportBinding;
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
                constraint: param.constraint.as_ref().map(|constraint| self.lower_type(constraint)),
                default: param.default.as_ref().map(|default| self.lower_type(default)),
            })
            .collect()
    }

    fn lower_type(&self, type_annotation: &TSType<'_>) -> TypeRef {
        match type_annotation {
            TSType::TSStringKeyword(_) => intrinsic("string"),
            TSType::TSNumberKeyword(_) => intrinsic("number"),
            TSType::TSBooleanKeyword(_) => intrinsic("boolean"),
            TSType::TSUnknownKeyword(_) => intrinsic("unknown"),
            TSType::TSAnyKeyword(_) => intrinsic("any"),
            TSType::TSUndefinedKeyword(_) => intrinsic("undefined"),
            TSType::TSNullKeyword(_) => intrinsic("null"),
            TSType::TSObjectKeyword(_) => intrinsic("object"),
            TSType::TSBigIntKeyword(_) => intrinsic("bigint"),
            TSType::TSSymbolKeyword(_) => intrinsic("symbol"),
            TSType::TSNeverKeyword(_) => intrinsic("never"),
            TSType::TSVoidKeyword(_) => intrinsic("void"),
            TSType::TSIntrinsicKeyword(keyword) => TypeRef::Intrinsic {
                name: slice_span(self.source, keyword.span()).to_string(),
            },
            TSType::TSLiteralType(literal) => TypeRef::Literal {
                value: slice_span(self.source, literal.span).to_string(),
            },
            TSType::TSUnionType(union) => TypeRef::Union {
                types: union
                    .types
                    .iter()
                    .map(|nested| self.lower_type(nested))
                    .collect(),
            },
            TSType::TSArrayType(array_type) => TypeRef::Array {
                element: Box::new(self.lower_type(&array_type.element_type)),
            },
            TSType::TSTupleType(tuple_type) => TypeRef::Tuple {
                elements: tuple_type
                    .element_types
                    .iter()
                    .map(|element| self.lower_tuple_element(element))
                    .collect(),
            },
            TSType::TSIntersectionType(intersection) => TypeRef::Intersection {
                types: intersection
                    .types
                    .iter()
                    .map(|nested| self.lower_type(nested))
                    .collect(),
            },
            TSType::TSTypeLiteral(type_literal) => TypeRef::Object {
                members: members_from_signatures(
                    type_literal.members.as_slice(),
                    self.source,
                    &[],
                    None,
                    self.import_bindings,
                    self.current_module_specifier,
                    self.current_library,
                ),
            },
            TSType::TSParenthesizedType(parenthesized) => {
                self.lower_type(&parenthesized.type_annotation)
            }
            TSType::TSTypeReference(reference) => self.lower_type_reference(reference),
            TSType::TSNamedTupleMember(named) => {
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
            TSType::TSIndexedAccessType(indexed_access) => TypeRef::IndexedAccess {
                object: Box::new(self.lower_type(&indexed_access.object_type)),
                index: Box::new(self.lower_type(&indexed_access.index_type)),
            },
            TSType::TSImportType(_) | TSType::TSInferType(_) => self.raw_type(type_annotation),
            TSType::TSFunctionType(function_type) => TypeRef::Function {
                params: self.lower_fn_params(&function_type.params),
                return_type: Box::new(self.lower_type(&function_type.return_type.type_annotation)),
            },
            TSType::TSConstructorType(constructor_type) => TypeRef::Constructor {
                r#abstract: constructor_type.r#abstract,
                type_parameters: self
                    .lower_type_parameters(constructor_type.type_parameters.as_deref()),
                params: self.lower_fn_params(&constructor_type.params),
                return_type: Box::new(
                    self.lower_type(&constructor_type.return_type.type_annotation),
                ),
            },
            TSType::TSTypeOperatorType(operator) => TypeRef::TypeOperator {
                operator: match operator.operator {
                    oxc_ast::ast::TSTypeOperatorOperator::Keyof => TypeOperatorKind::Keyof,
                    oxc_ast::ast::TSTypeOperatorOperator::Readonly => TypeOperatorKind::Readonly,
                    oxc_ast::ast::TSTypeOperatorOperator::Unique => TypeOperatorKind::Unique,
                },
                target: Box::new(self.lower_type(&operator.type_annotation)),
            },
            TSType::TSTypeQuery(query) => TypeRef::TypeQuery {
                expression: slice_span(self.source, query.expr_name.span()).to_string(),
            },
            TSType::TSConditionalType(conditional) => TypeRef::Conditional {
                check_type: Box::new(self.lower_type(&conditional.check_type)),
                extends_type: Box::new(self.lower_type(&conditional.extends_type)),
                true_type: Box::new(self.lower_type(&conditional.true_type)),
                false_type: Box::new(self.lower_type(&conditional.false_type)),
            },
            TSType::TSMappedType(mapped) => TypeRef::Mapped {
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
            },
            TSType::TSTemplateLiteralType(template) => TypeRef::TemplateLiteral {
                parts: self.lower_template_literal_parts(template),
            },
            TSType::TSTypePredicate(_) | TSType::TSThisType(_) => self.raw_type(type_annotation),
            TSType::JSDocNullableType(_)
            | TSType::JSDocNonNullableType(_)
            | TSType::JSDocUnknownType(_) => self.raw_type(type_annotation),
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

pub(super) fn collect_references_from_members(
    members: &[TsMember],
    extends: &[TypeRef],
    underlying: Option<&TypeRef>,
    type_parameters: &[TsTypeParameter],
) -> Vec<TypeRef> {
    let mut references = Vec::new();
    references.extend(extends.iter().cloned());

    if let Some(underlying) = underlying {
        collect_type_ref_references(underlying, &mut references);
    }

    for member in members {
        collect_optional_type_ref_references(member.type_ref.as_ref(), &mut references);
    }

    for type_parameter in type_parameters {
        collect_type_parameter_references(type_parameter, &mut references);
    }

    references
}

fn collect_optional_type_ref_references(type_ref: Option<&TypeRef>, references: &mut Vec<TypeRef>) {
    if let Some(type_ref) = type_ref {
        collect_type_ref_references(type_ref, references);
    }
}

fn collect_type_parameter_references(
    type_parameter: &TsTypeParameter,
    references: &mut Vec<TypeRef>,
) {
    collect_optional_type_ref_references(type_parameter.constraint.as_ref(), references);
    collect_optional_type_ref_references(type_parameter.default.as_ref(), references);
}

fn collect_fn_param_references(param: &FnParam, references: &mut Vec<TypeRef>) {
    collect_optional_type_ref_references(param.type_ref.as_ref(), references);
}

fn collect_type_ref_references(type_ref: &TypeRef, references: &mut Vec<TypeRef>) {
    match type_ref {
        TypeRef::Reference {
            type_arguments: Some(arguments),
            ..
        } => {
            references.push(type_ref.clone());
            for argument in arguments {
                collect_type_ref_references(argument, references);
            }
        }
        TypeRef::Reference { .. } => references.push(type_ref.clone()),
        TypeRef::Union { types } | TypeRef::Intersection { types } => {
            for nested in types {
                collect_type_ref_references(nested, references);
            }
        }
        TypeRef::Array { element } => collect_type_ref_references(element, references),
        TypeRef::Tuple { elements } => {
            for element in elements {
                collect_type_ref_references(&element.element, references);
            }
        }
        TypeRef::Object { members } => {
            for member in members {
                collect_optional_type_ref_references(member.type_ref.as_ref(), references);
            }
        }
        TypeRef::IndexedAccess { object, index } => {
            collect_type_ref_references(object, references);
            collect_type_ref_references(index, references);
        }
        TypeRef::Function { params, return_type } => {
            for param in params {
                collect_fn_param_references(param, references);
            }
            collect_type_ref_references(return_type, references);
        }
        TypeRef::Constructor {
            type_parameters,
            params,
            return_type,
            ..
        } => {
            for type_parameter in type_parameters {
                collect_type_parameter_references(type_parameter, references);
            }
            for param in params {
                collect_fn_param_references(param, references);
            }
            collect_type_ref_references(return_type, references);
        }
        TypeRef::TypeOperator { target, .. } => {
            collect_type_ref_references(target, references);
        }
        TypeRef::TypeQuery { .. } => {}
        TypeRef::Conditional {
            check_type,
            extends_type,
            true_type,
            false_type,
        } => {
            collect_type_ref_references(check_type, references);
            collect_type_ref_references(extends_type, references);
            collect_type_ref_references(true_type, references);
            collect_type_ref_references(false_type, references);
        }
        TypeRef::Mapped {
            source_type,
            name_type,
            value_type,
            ..
        } => {
            collect_type_ref_references(source_type, references);
            collect_optional_type_ref_references(name_type.as_deref(), references);
            collect_optional_type_ref_references(value_type.as_deref(), references);
        }
        TypeRef::TemplateLiteral { parts } => {
            for part in parts {
                if let TemplateLiteralPart::Type { value } = part {
                    collect_type_ref_references(value, references);
                }
            }
        }
        _ => {}
    }
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

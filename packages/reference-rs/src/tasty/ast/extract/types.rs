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

pub(super) fn type_parameters_from_oxc<'a>(
    decl: Option<&TSTypeParameterDeclaration<'a>>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> Vec<TsTypeParameter> {
    let Some(decl) = decl else {
        return Vec::new();
    };

    decl.params
        .iter()
        .map(|param| {
            let name = slice_span(source, param.name.span()).to_string();
            let constraint = param.constraint.as_ref().map(|t| {
                type_to_ref(
                    t,
                    source,
                    import_bindings,
                    current_module_specifier,
                    current_library,
                )
            });
            let default = param.default.as_ref().map(|t| {
                type_to_ref(
                    t,
                    source,
                    import_bindings,
                    current_module_specifier,
                    current_library,
                )
            });

            TsTypeParameter {
                name,
                constraint,
                default,
            }
        })
        .collect()
}

pub(super) fn type_to_ref(
    type_annotation: &TSType<'_>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> TypeRef {
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
            name: slice_span(source, keyword.span()).to_string(),
        },
        TSType::TSLiteralType(literal) => TypeRef::Literal {
            value: slice_span(source, literal.span).to_string(),
        },
        TSType::TSUnionType(union) => TypeRef::Union {
            types: union
                .types
                .iter()
                .map(|nested| {
                    type_to_ref(
                        nested,
                        source,
                        import_bindings,
                        current_module_specifier,
                        current_library,
                    )
                })
                .collect(),
        },
        TSType::TSArrayType(array_type) => TypeRef::Array {
            element: Box::new(type_to_ref(
                &array_type.element_type,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            )),
        },
        TSType::TSTupleType(tuple_type) => TypeRef::Tuple {
            elements: tuple_type
                .element_types
                .iter()
                .map(|element| {
                    tuple_element_to_tuple_element(
                        element,
                        source,
                        import_bindings,
                        current_module_specifier,
                        current_library,
                    )
                })
                .collect(),
        },
        TSType::TSIntersectionType(intersection) => TypeRef::Intersection {
            types: intersection
                .types
                .iter()
                .map(|nested| {
                    type_to_ref(
                        nested,
                        source,
                        import_bindings,
                        current_module_specifier,
                        current_library,
                    )
                })
                .collect(),
        },
        TSType::TSTypeLiteral(type_literal) => TypeRef::Object {
            members: members_from_signatures(
                type_literal.members.as_slice(),
                source,
                &[],
                None,
                import_bindings,
                current_module_specifier,
                current_library,
            ),
        },
        TSType::TSParenthesizedType(parenthesized) => type_to_ref(
            &parenthesized.type_annotation,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
        ),
        TSType::TSTypeReference(reference) => {
            let name = slice_span(source, reference.type_name.span()).to_string();
            let lookup_name = reference_lookup_name(&name);
            let type_arguments = reference.type_arguments.as_ref().map(|instantiation| {
                instantiation
                    .params
                    .iter()
                    .map(|argument| {
                        type_to_ref(
                            argument,
                            source,
                            import_bindings,
                            current_module_specifier,
                            current_library,
                        )
                    })
                    .collect::<Vec<_>>()
            });

            if lookup_name == "Array" && type_arguments.as_ref().is_some_and(|args| args.len() == 1) {
                let element = type_arguments.as_ref().unwrap()[0].clone();
                TypeRef::Array {
                    element: Box::new(element),
                }
            } else {
                let source_module = reference_source_module(
                    &name,
                    import_bindings,
                    current_module_specifier,
                    current_library,
                );
                TypeRef::Reference {
                    name,
                    target_id: None,
                    source_module,
                    type_arguments,
                }
            }
        }
        TSType::TSNamedTupleMember(named) => {
            let inner = tuple_element_to_tuple_element(
                &named.element_type,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            );
            TypeRef::Tuple {
                elements: vec![TupleElement {
                    label: Some(slice_span(source, named.label.span()).to_string()),
                    optional: named.optional,
                    rest: false,
                    element: inner.element,
                }],
            }
        }
        TSType::TSIndexedAccessType(indexed_access) => TypeRef::IndexedAccess {
            object: Box::new(type_to_ref(
                &indexed_access.object_type,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            )),
            index: Box::new(type_to_ref(
                &indexed_access.index_type,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            )),
        },
        TSType::TSImportType(_) | TSType::TSInferType(_) => raw_type(type_annotation, source),
        TSType::TSFunctionType(function_type) => TypeRef::Function {
            params: formal_params_to_fn_params(
                &function_type.params,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            ),
            return_type: Box::new(type_to_ref(
                &function_type.return_type.type_annotation,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            )),
        },
        TSType::TSConstructorType(constructor_type) => TypeRef::Constructor {
            r#abstract: constructor_type.r#abstract,
            type_parameters: type_parameters_from_oxc(
                constructor_type.type_parameters.as_deref(),
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            ),
            params: formal_params_to_fn_params(
                &constructor_type.params,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            ),
            return_type: Box::new(type_to_ref(
                &constructor_type.return_type.type_annotation,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            )),
        },
        TSType::TSTypeOperatorType(operator) => TypeRef::TypeOperator {
            operator: match operator.operator {
                oxc_ast::ast::TSTypeOperatorOperator::Keyof => TypeOperatorKind::Keyof,
                oxc_ast::ast::TSTypeOperatorOperator::Readonly => TypeOperatorKind::Readonly,
                oxc_ast::ast::TSTypeOperatorOperator::Unique => TypeOperatorKind::Unique,
            },
            target: Box::new(type_to_ref(
                &operator.type_annotation,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            )),
        },
        TSType::TSTypeQuery(query) => TypeRef::TypeQuery {
            expression: slice_span(source, query.expr_name.span()).to_string(),
        },
        TSType::TSConditionalType(conditional) => TypeRef::Conditional {
            check_type: Box::new(type_to_ref(
                &conditional.check_type,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            )),
            extends_type: Box::new(type_to_ref(
                &conditional.extends_type,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            )),
            true_type: Box::new(type_to_ref(
                &conditional.true_type,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            )),
            false_type: Box::new(type_to_ref(
                &conditional.false_type,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            )),
        },
        TSType::TSMappedType(mapped) => TypeRef::Mapped {
            type_param: slice_span(source, mapped.key.span()).to_string(),
            source_type: Box::new(type_to_ref(
                &mapped.constraint,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            )),
            name_type: mapped.name_type.as_ref().map(|name_type| {
                Box::new(type_to_ref(
                    name_type,
                    source,
                    import_bindings,
                    current_module_specifier,
                    current_library,
                ))
            }),
            optional_modifier: mapped_modifier_kind(mapped.optional),
            readonly_modifier: mapped_modifier_kind(mapped.readonly),
            value_type: mapped.type_annotation.as_ref().map(|value_type| {
                Box::new(type_to_ref(
                    value_type,
                    source,
                    import_bindings,
                    current_module_specifier,
                    current_library,
                ))
            }),
        },
        TSType::TSTemplateLiteralType(template) => TypeRef::TemplateLiteral {
            parts: template_literal_parts(
                template,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            ),
        },
        TSType::TSTypePredicate(_) | TSType::TSThisType(_) => raw_type(type_annotation, source),
        TSType::JSDocNullableType(_)
        | TSType::JSDocNonNullableType(_)
        | TSType::JSDocUnknownType(_) => raw_type(type_annotation, source),
    }
}

pub(super) fn expression_to_reference(
    expression: &Expression<'_>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> TypeRef {
    let name = slice_span(source, expression.span()).to_string();
    let source_module = reference_source_module(
        &name,
        import_bindings,
        current_module_specifier,
        current_library,
    );

    TypeRef::Reference {
        name,
        target_id: None,
        source_module,
        type_arguments: None,
    }
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
        if let Some(type_ref) = &member.type_ref {
            collect_type_ref_references(type_ref, &mut references);
        }
    }

    for type_parameter in type_parameters {
        if let Some(constraint) = &type_parameter.constraint {
            collect_type_ref_references(constraint, &mut references);
        }
        if let Some(default) = &type_parameter.default {
            collect_type_ref_references(default, &mut references);
        }
    }

    references
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
                if let Some(type_ref) = &member.type_ref {
                    collect_type_ref_references(type_ref, references);
                }
            }
        }
        TypeRef::IndexedAccess { object, index } => {
            collect_type_ref_references(object, references);
            collect_type_ref_references(index, references);
        }
        TypeRef::Function { params, return_type } => {
            for param in params {
                if let Some(type_ref) = &param.type_ref {
                    collect_type_ref_references(type_ref, references);
                }
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
                if let Some(constraint) = &type_parameter.constraint {
                    collect_type_ref_references(constraint, references);
                }
                if let Some(default) = &type_parameter.default {
                    collect_type_ref_references(default, references);
                }
            }
            for param in params {
                if let Some(type_ref) = &param.type_ref {
                    collect_type_ref_references(type_ref, references);
                }
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
            if let Some(name_type) = name_type {
                collect_type_ref_references(name_type, references);
            }
            if let Some(value_type) = value_type {
                collect_type_ref_references(value_type, references);
            }
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

fn tuple_element_to_tuple_element(
    element: &TSTupleElement<'_>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> TupleElement {
    match element {
        TSTupleElement::TSOptionalType(optional) => TupleElement {
            label: None,
            optional: true,
            rest: false,
            element: type_to_ref(
                &optional.type_annotation,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            ),
        },
        TSTupleElement::TSRestType(rest) => TupleElement {
            label: None,
            optional: false,
            rest: true,
            element: type_to_ref(
                &rest.type_annotation,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            ),
        },
        TSTupleElement::TSNamedTupleMember(named) => {
            let lowered = tuple_element_to_tuple_element(
                &named.element_type,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            );

            TupleElement {
                label: Some(slice_span(source, named.label.span()).to_string()),
                optional: named.optional,
                rest: false,
                element: lowered.element,
            }
        }
        _ => TupleElement {
            label: None,
            optional: false,
            rest: false,
            element: tuple_element_type_to_ref(
                element,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            ),
        },
    }
}

fn tuple_element_type_to_ref(
    element: &TSTupleElement<'_>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> TypeRef {
    let element_source = slice_span(source, element.span());
    let wrapped_source = format!("type __TastyTupleElement = {element_source};");
    let allocator = Allocator::default();
    let source_type = SourceType::from_path("tuple-element.ts").unwrap_or_default();
    let parse_result = Parser::new(&allocator, &wrapped_source, source_type).parse();

    // Reparse a single tuple element through a synthetic alias so we can reuse
    // the normal type-lowering path without special-casing every tuple variant.
    if let Some(oxc_ast::ast::Statement::TSTypeAliasDeclaration(type_alias)) =
        parse_result.program.body.first()
    {
        return type_to_ref(
            &type_alias.type_annotation,
            &wrapped_source,
            import_bindings,
            current_module_specifier,
            current_library,
        );
    }

    TypeRef::Raw {
        summary: element_source.to_string(),
    }
}

fn formal_params_to_fn_params(
    params: &FormalParameters<'_>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> Vec<FnParam> {
    let mut lowered_params =
        Vec::with_capacity(params.items.len() + params.rest.as_ref().map(|_| 1).unwrap_or(0));

    for param in &params.items {
        lowered_params.push(FnParam {
            name: Some(slice_span(source, param.pattern.span()).to_string()),
            optional: param.optional,
            type_ref: param.type_annotation.as_ref().map(|annotation| {
                type_to_ref(
                    &annotation.type_annotation,
                    source,
                    import_bindings,
                    current_module_specifier,
                    current_library,
                )
            }),
        });
    }

    if let Some(rest) = &params.rest {
        lowered_params.push(FnParam {
            name: Some(slice_span(source, rest.rest.span()).to_string()),
            optional: false,
            type_ref: rest.type_annotation.as_ref().map(|annotation| {
                type_to_ref(
                    &annotation.type_annotation,
                    source,
                    import_bindings,
                    current_module_specifier,
                    current_library,
                )
            }),
        });
    }

    lowered_params
}

fn template_literal_parts(
    template: &oxc_ast::ast::TSTemplateLiteralType<'_>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> Vec<TemplateLiteralPart> {
    let mut parts = Vec::with_capacity(template.quasis.len() + template.types.len());

    for (index, quasi) in template.quasis.iter().enumerate() {
        parts.push(TemplateLiteralPart::Text {
            value: quasi.value.raw.as_str().to_string(),
        });

        if let Some(type_part) = template.types.get(index) {
            parts.push(TemplateLiteralPart::Type {
                value: type_to_ref(
                    type_part,
                    source,
                    import_bindings,
                    current_module_specifier,
                    current_library,
                ),
            });
        }
    }

    parts
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

use std::collections::BTreeMap;

use oxc_allocator::Allocator;
use oxc_ast::ast::{
    Comment, Expression, FormalParameters, PropertyKey, TSCallSignatureDeclaration,
    TSConstructSignatureDeclaration, TSIndexSignature, TSMethodSignature, TSPropertySignature,
    TSSignature, TSType, TSTypeParameterDeclaration, TSTupleElement,
};
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType};

use super::comments::{leading_comment_for_span, parse_comment_metadata};
use super::super::super::model::{
    FnParam, MappedModifierKind, TemplateLiteralPart, TsMember, TsMemberKind, TsTypeParameter,
    TupleElement, TypeOperatorKind, TypeRef,
};
use super::super::model::ImportBinding;

pub(super) fn property_signature_to_member(
    property: &TSPropertySignature<'_>,
    source: &str,
    comments: &[Comment],
    exclude_starts_between: Option<&[u32]>,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> TsMember {
    let name = property_key_name(&property.key, source);
    let comment = parse_comment_metadata(leading_comment_for_span(
        source,
        comments,
        property.span(),
        exclude_starts_between,
    ));
    let type_ref = property.type_annotation.as_ref().map(|annotation| {
        type_to_ref(
            &annotation.type_annotation,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
        )
    });

    TsMember {
        name,
        optional: property.optional,
        readonly: property.readonly,
        kind: TsMemberKind::Property,
        description: comment.description,
        description_raw: comment.description_raw,
        jsdoc: comment.jsdoc,
        type_ref,
    }
}

pub(super) fn method_signature_to_member(
    method: &TSMethodSignature<'_>,
    source: &str,
    comments: &[Comment],
    exclude_starts_between: Option<&[u32]>,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> TsMember {
    let name = property_key_name(&method.key, source);
    let comment = parse_comment_metadata(leading_comment_for_span(
        source,
        comments,
        method.span(),
        exclude_starts_between,
    ));
    let type_ref = method.return_type.as_ref().map(|annotation| {
        type_to_ref(
            &annotation.type_annotation,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
        )
    });

    TsMember {
        name,
        optional: method.optional,
        readonly: false,
        kind: TsMemberKind::Method,
        description: comment.description,
        description_raw: comment.description_raw,
        jsdoc: comment.jsdoc,
        type_ref,
    }
}

pub(super) fn call_signature_to_member(
    call: &TSCallSignatureDeclaration<'_>,
    source: &str,
    comments: &[Comment],
    exclude_starts_between: Option<&[u32]>,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> TsMember {
    let comment = parse_comment_metadata(leading_comment_for_span(
        source,
        comments,
        call.span(),
        exclude_starts_between,
    ));
    let type_ref = call.return_type.as_ref().map(|annotation| {
        type_to_ref(
            &annotation.type_annotation,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
        )
    });

    TsMember {
        name: "[call]".to_string(),
        optional: false,
        readonly: false,
        kind: TsMemberKind::CallSignature,
        description: comment.description,
        description_raw: comment.description_raw,
        jsdoc: comment.jsdoc,
        type_ref,
    }
}

pub(super) fn construct_signature_to_member(
    decl: &TSConstructSignatureDeclaration<'_>,
    source: &str,
    comments: &[Comment],
    exclude_starts_between: Option<&[u32]>,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> TsMember {
    let comment = parse_comment_metadata(leading_comment_for_span(
        source,
        comments,
        decl.span(),
        exclude_starts_between,
    ));
    let type_ref = decl.return_type.as_ref().map(|annotation| {
        type_to_ref(
            &annotation.type_annotation,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
        )
    });

    TsMember {
        name: "[new]".to_string(),
        optional: false,
        readonly: false,
        kind: TsMemberKind::ConstructSignature,
        description: comment.description,
        description_raw: comment.description_raw,
        jsdoc: comment.jsdoc,
        type_ref,
    }
}

pub(super) fn index_signature_to_member(
    index: &TSIndexSignature<'_>,
    source: &str,
    comments: &[Comment],
    exclude_starts_between: Option<&[u32]>,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> TsMember {
    let comment = parse_comment_metadata(leading_comment_for_span(
        source,
        comments,
        index.span(),
        exclude_starts_between,
    ));
    let type_ref = Some(type_to_ref(
        &index.type_annotation.type_annotation,
        source,
        import_bindings,
        current_module_specifier,
        current_library,
    ));

    TsMember {
        name: "[index]".to_string(),
        optional: false,
        readonly: index.readonly,
        kind: TsMemberKind::IndexSignature,
        description: comment.description,
        description_raw: comment.description_raw,
        jsdoc: comment.jsdoc,
        type_ref,
    }
}

fn tuple_element_to_tuple_element(
    el: &TSTupleElement<'_>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> TupleElement {
    match el {
        TSTupleElement::TSOptionalType(opt) => TupleElement {
            label: None,
            optional: true,
            rest: false,
            element: type_to_ref(
                &opt.type_annotation,
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
            let label = slice_span(source, named.label.span()).to_string();
            let element = tuple_element_to_tuple_element(
                &named.element_type,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            );
            TupleElement {
                label: Some(label),
                optional: named.optional,
                rest: false,
                element: element.element,
            }
        }
        _ => TupleElement {
            label: None,
            optional: false,
            rest: false,
            element: tuple_element_type_to_ref(
                el,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            ),
        },
    }
}

fn tuple_element_type_to_ref(
    el: &TSTupleElement<'_>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> TypeRef {
    let element_source = slice_span(source, el.span());
    let wrapped_source = format!("type __TastyTupleElement = {element_source};");
    let allocator = Allocator::default();
    let source_type = SourceType::from_path("tuple-element.ts").unwrap_or_default();
    let parse_result = Parser::new(&allocator, &wrapped_source, source_type).parse();

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
    let mut out =
        Vec::with_capacity(params.items.len() + params.rest.as_ref().map(|_| 1).unwrap_or(0));
    for param in &params.items {
        let name = Some(slice_span(source, param.pattern.span()).to_string());
        let type_ref = param.type_annotation.as_ref().map(|ann| {
            type_to_ref(
                &ann.type_annotation,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            )
        });
        out.push(FnParam {
            name,
            optional: param.optional,
            type_ref,
        });
    }
    if let Some(rest) = &params.rest {
        let name = Some(slice_span(source, rest.rest.span()).to_string());
        let type_ref = rest.type_annotation.as_ref().map(|ann| {
            type_to_ref(
                &ann.type_annotation,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            )
        });
        out.push(FnParam {
            name,
            optional: false,
            type_ref,
        });
    }
    out
}

pub(super) fn type_parameters_from_oxc<'a>(
    decl: Option<&TSTypeParameterDeclaration<'a>>,
    source: &str,
    _comments: &[Comment],
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
        TSType::TSStringKeyword(_) => TypeRef::Intrinsic {
            name: "string".to_string(),
        },
        TSType::TSNumberKeyword(_) => TypeRef::Intrinsic {
            name: "number".to_string(),
        },
        TSType::TSBooleanKeyword(_) => TypeRef::Intrinsic {
            name: "boolean".to_string(),
        },
        TSType::TSUnknownKeyword(_) => TypeRef::Intrinsic {
            name: "unknown".to_string(),
        },
        TSType::TSAnyKeyword(_) => TypeRef::Intrinsic {
            name: "any".to_string(),
        },
        TSType::TSUndefinedKeyword(_) => TypeRef::Intrinsic {
            name: "undefined".to_string(),
        },
        TSType::TSNullKeyword(_) => TypeRef::Intrinsic {
            name: "null".to_string(),
        },
        TSType::TSObjectKeyword(_) => TypeRef::Intrinsic {
            name: "object".to_string(),
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
        TSType::TSArrayType(arr) => TypeRef::Array {
            element: Box::new(type_to_ref(
                &arr.element_type,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            )),
        },
        TSType::TSTupleType(tuple) => TypeRef::Tuple {
            elements: tuple
                .element_types
                .iter()
                .map(|el| {
                    tuple_element_to_tuple_element(
                        el,
                        source,
                        import_bindings,
                        current_module_specifier,
                        current_library,
                    )
                })
                .collect(),
        },
        TSType::TSIntersectionType(inter) => TypeRef::Intersection {
            types: inter
                .types
                .iter()
                .map(|t| {
                    type_to_ref(
                        t,
                        source,
                        import_bindings,
                        current_module_specifier,
                        current_library,
                    )
                })
                .collect(),
        },
        TSType::TSTypeLiteral(lit) => {
            let all_starts: Vec<u32> = lit.members.iter().map(|s| s.span().start).collect();
            let no_comments: &[Comment] = &[];
            let members: Vec<TsMember> = lit
                .members
                .iter()
                .filter_map(|sig| {
                    let start = sig.span().start;
                    let others: Vec<u32> =
                        all_starts.iter().copied().filter(|&s| s != start).collect();
                    let exclude = if others.is_empty() {
                        None
                    } else {
                        Some(others.as_slice())
                    };
                    match sig {
                        TSSignature::TSPropertySignature(property) => Some(
                            property_signature_to_member(
                                property,
                                source,
                                no_comments,
                                exclude,
                                import_bindings,
                                current_module_specifier,
                                current_library,
                            ),
                        ),
                        TSSignature::TSMethodSignature(method) => Some(method_signature_to_member(
                            method,
                            source,
                            no_comments,
                            exclude,
                            import_bindings,
                            current_module_specifier,
                            current_library,
                        )),
                        TSSignature::TSCallSignatureDeclaration(call) => {
                            Some(call_signature_to_member(
                                call,
                                source,
                                no_comments,
                                exclude,
                                import_bindings,
                                current_module_specifier,
                                current_library,
                            ))
                        }
                        TSSignature::TSIndexSignature(index) => Some(index_signature_to_member(
                            index,
                            source,
                            no_comments,
                            exclude,
                            import_bindings,
                            current_module_specifier,
                            current_library,
                        )),
                        TSSignature::TSConstructSignatureDeclaration(decl) => {
                            Some(construct_signature_to_member(
                                decl,
                                source,
                                no_comments,
                                exclude,
                                import_bindings,
                                current_module_specifier,
                                current_library,
                            ))
                        }
                    }
                })
                .collect();
            TypeRef::Object { members }
        }
        TSType::TSParenthesizedType(parent) => type_to_ref(
            &parent.type_annotation,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
        ),
        TSType::TSTypeReference(reference) => {
            let name = slice_span(source, reference.type_name.span()).to_string();
            let lookup = reference_lookup_name(&name);
            let type_arguments = reference.type_arguments.as_ref().map(|inst| {
                inst.params
                    .iter()
                    .map(|t| {
                        type_to_ref(
                            t,
                            source,
                            import_bindings,
                            current_module_specifier,
                            current_library,
                        )
                    })
                    .collect::<Vec<_>>()
            });
            if lookup == "Array" && type_arguments.as_ref().is_some_and(|a| a.len() == 1) {
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
        TSType::TSBigIntKeyword(_) => TypeRef::Intrinsic {
            name: "bigint".to_string(),
        },
        TSType::TSSymbolKeyword(_) => TypeRef::Intrinsic {
            name: "symbol".to_string(),
        },
        TSType::TSNeverKeyword(_) => TypeRef::Intrinsic {
            name: "never".to_string(),
        },
        TSType::TSVoidKeyword(_) => TypeRef::Intrinsic {
            name: "void".to_string(),
        },
        TSType::TSIntrinsicKeyword(kw) => TypeRef::Intrinsic {
            name: slice_span(source, kw.span()).to_string(),
        },
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
        TSType::TSIndexedAccessType(idx) => TypeRef::IndexedAccess {
            object: Box::new(type_to_ref(
                &idx.object_type,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            )),
            index: Box::new(type_to_ref(
                &idx.index_type,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            )),
        },
        TSType::TSImportType(_) | TSType::TSInferType(_) => TypeRef::Raw {
            summary: slice_span(source, type_annotation.span()).to_string(),
        },
        TSType::TSFunctionType(func) => {
            let params = formal_params_to_fn_params(
                &func.params,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            );
            let return_type = type_to_ref(
                &func.return_type.type_annotation,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            );
            TypeRef::Function {
                params,
                return_type: Box::new(return_type),
            }
        }
        TSType::TSConstructorType(constructor) => {
            let params = formal_params_to_fn_params(
                &constructor.params,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            );
            let return_type = type_to_ref(
                &constructor.return_type.type_annotation,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            );
            let type_parameters = type_parameters_from_oxc(
                constructor.type_parameters.as_deref(),
                source,
                &[],
                import_bindings,
                current_module_specifier,
                current_library,
            );
            TypeRef::Constructor {
                r#abstract: constructor.r#abstract,
                type_parameters,
                params,
                return_type: Box::new(return_type),
            }
        }
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
        TSType::TSTemplateLiteralType(template) => {
            let mut parts = Vec::with_capacity(template.quasis.len() + template.types.len());
            for (index, quasi) in template.quasis.iter().enumerate() {
                parts.push(TemplateLiteralPart::Text {
                    value: quasi.value.raw.as_str().to_string(),
                });
                if let Some(ty) = template.types.get(index) {
                    parts.push(TemplateLiteralPart::Type {
                        value: type_to_ref(
                            ty,
                            source,
                            import_bindings,
                            current_module_specifier,
                            current_library,
                        ),
                    });
                }
            }
            TypeRef::TemplateLiteral { parts }
        }
        TSType::TSTypePredicate(_) | TSType::TSThisType(_) => TypeRef::Raw {
            summary: slice_span(source, type_annotation.span()).to_string(),
        },
        TSType::JSDocNullableType(_)
        | TSType::JSDocNonNullableType(_)
        | TSType::JSDocUnknownType(_) => TypeRef::Raw {
            summary: slice_span(source, type_annotation.span()).to_string(),
        },
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
    for param in type_parameters {
        if let Some(ref c) = param.constraint {
            collect_type_ref_references(c, &mut references);
        }
        if let Some(ref d) = param.default {
            collect_type_ref_references(d, &mut references);
        }
    }
    references
}

fn collect_type_ref_references(type_ref: &TypeRef, references: &mut Vec<TypeRef>) {
    match type_ref {
        TypeRef::Reference {
            type_arguments: Some(args),
            ..
        } => {
            references.push(type_ref.clone());
            for arg in args {
                collect_type_ref_references(arg, references);
            }
        }
        TypeRef::Reference { .. } => references.push(type_ref.clone()),
        TypeRef::Union { types } => {
            for nested in types {
                collect_type_ref_references(nested, references);
            }
        }
        TypeRef::Array { element } => collect_type_ref_references(element, references),
        TypeRef::Tuple { elements } => {
            for te in elements {
                collect_type_ref_references(&te.element, references);
            }
        }
        TypeRef::Intersection { types } => {
            for t in types {
                collect_type_ref_references(t, references);
            }
        }
        TypeRef::Object { members } => {
            for m in members {
                if let Some(ref tr) = m.type_ref {
                    collect_type_ref_references(tr, references);
                }
            }
        }
        TypeRef::IndexedAccess { object, index } => {
            collect_type_ref_references(object, references);
            collect_type_ref_references(index, references);
        }
        TypeRef::Function { params, return_type } => {
            for p in params {
                if let Some(ref tr) = p.type_ref {
                    collect_type_ref_references(tr, references);
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
            for param in type_parameters {
                if let Some(ref c) = param.constraint {
                    collect_type_ref_references(c, references);
                }
                if let Some(ref d) = param.default {
                    collect_type_ref_references(d, references);
                }
            }
            for p in params {
                if let Some(ref tr) = p.type_ref {
                    collect_type_ref_references(tr, references);
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

fn property_key_name(key: &PropertyKey<'_>, source: &str) -> String {
    slice_span(source, key.span()).to_string()
}

fn slice_span(source: &str, span: oxc_span::Span) -> &str {
    &source[span.start as usize..span.end as usize]
}

use super::utils::{property_key_name, reference_name, slice_span, strip_wrapped_quotes};
use crate::atlas::internal::{PropDef, PropValueType, TypeExpr};
use oxc_ast::ast::{TSLiteral, TSSignature, TSType};
use oxc_span::GetSpan;

pub(super) fn type_expr_from_interface(
    interface_decl: &oxc_allocator::Box<'_, oxc_ast::ast::TSInterfaceDeclaration<'_>>,
    source: &str,
) -> TypeExpr {
    let mut parts = interface_decl
        .extends
        .iter()
        .map(|heritage| {
            TypeExpr::Reference(reference_name(slice_span(
                source,
                heritage.expression.span(),
            )))
        })
        .collect::<Vec<_>>();

    let props = interface_decl
        .body
        .body
        .iter()
        .filter_map(|signature| match signature {
            TSSignature::TSPropertySignature(property) => property_key_name(&property.key, source)
                .map(|name| PropDef {
                    name,
                    value_type: property
                        .type_annotation
                        .as_ref()
                        .map(|annotation| {
                            prop_value_type_from_type(&annotation.type_annotation, source)
                        })
                        .unwrap_or(PropValueType::Unknown),
                }),
            _ => None,
        })
        .collect::<Vec<_>>();

    if !props.is_empty() {
        parts.push(TypeExpr::Object(props));
    }

    match parts.len() {
        0 => TypeExpr::Unknown,
        1 => parts.remove(0),
        _ => TypeExpr::Intersection(parts),
    }
}

pub(super) fn type_expr_from_type(type_annotation: &TSType<'_>, source: &str) -> TypeExpr {
    match type_annotation {
        TSType::TSTypeLiteral(type_literal) => TypeExpr::Object(
            type_literal
                .members
                .iter()
                .filter_map(|signature| match signature {
                    TSSignature::TSPropertySignature(property) => {
                        property_key_name(&property.key, source).map(|name| PropDef {
                            name,
                            value_type: property
                                .type_annotation
                                .as_ref()
                                .map(|annotation| {
                                    prop_value_type_from_type(&annotation.type_annotation, source)
                                })
                                .unwrap_or(PropValueType::Unknown),
                        })
                    }
                    _ => None,
                })
                .collect(),
        ),
        TSType::TSIntersectionType(intersection) => TypeExpr::Intersection(
            intersection
                .types
                .iter()
                .map(|nested| type_expr_from_type(nested, source))
                .collect(),
        ),
        TSType::TSTypeReference(reference) => TypeExpr::Reference(reference_name(slice_span(
            source,
            reference.type_name.span(),
        ))),
        TSType::TSUnionType(union) => union_literals(union.types.iter().collect(), source)
            .map(TypeExpr::UnionLiterals)
            .unwrap_or(TypeExpr::Unknown),
        TSType::TSLiteralType(literal) => single_literal_value(&literal.literal, source)
            .map(|value| TypeExpr::UnionLiterals(vec![value]))
            .unwrap_or(TypeExpr::Unknown),
        TSType::TSParenthesizedType(parenthesized) => {
            type_expr_from_type(&parenthesized.type_annotation, source)
        }
        _ => TypeExpr::Unknown,
    }
}

fn prop_value_type_from_type(type_annotation: &TSType<'_>, source: &str) -> PropValueType {
    match type_annotation {
        TSType::TSTypeReference(reference) => PropValueType::Reference(reference_name(slice_span(
            source,
            reference.type_name.span(),
        ))),
        TSType::TSUnionType(union) => union_literals(union.types.iter().collect(), source)
            .map(PropValueType::UnionLiterals)
            .unwrap_or(PropValueType::Unknown),
        TSType::TSLiteralType(literal) => single_literal_value(&literal.literal, source)
            .map(|value| PropValueType::UnionLiterals(vec![value]))
            .unwrap_or(PropValueType::Unknown),
        TSType::TSParenthesizedType(parenthesized) => {
            prop_value_type_from_type(&parenthesized.type_annotation, source)
        }
        _ => PropValueType::Unknown,
    }
}

fn union_literals(types: Vec<&TSType<'_>>, source: &str) -> Option<Vec<String>> {
    let mut values = Vec::new();
    for nested in types {
        values.push(single_type_literal_value(nested, source)?);
    }
    Some(values)
}

fn single_type_literal_value(type_annotation: &TSType<'_>, source: &str) -> Option<String> {
    match type_annotation {
        TSType::TSLiteralType(literal) => single_literal_value(&literal.literal, source),
        TSType::TSParenthesizedType(parenthesized) => {
            single_type_literal_value(&parenthesized.type_annotation, source)
        }
        _ => None,
    }
}

fn single_literal_value(literal: &TSLiteral<'_>, source: &str) -> Option<String> {
    let raw = slice_span(source, literal.span()).trim();
    Some(strip_wrapped_quotes(raw).unwrap_or(raw).to_string())
}

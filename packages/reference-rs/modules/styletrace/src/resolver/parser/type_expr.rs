//! Lowers TypeScript interfaces, type aliases and type annotations into the resolver's `TypeExpr` graph.
//! It takes oxc declaration and type nodes plus the module's source text, and emits `InterfaceDecl`, `TypeAliasDecl`
//! and `TypeExpr` values for object members, unions, intersections, references, mapped and conditional types.
//! Forms the resolver does not model lower to `TypeExpr::Unknown`, so they contribute no style-prop names.

use std::collections::BTreeSet;

use oxc_ast::ast::{
    TSConditionalType, TSIndexedAccessType, TSInterfaceDeclaration, TSIntersectionType, TSLiteral,
    TSMappedType, TSSignature, TSType, TSTypeAliasDeclaration, TSTypeLiteral, TSTypeOperator,
    TSTypeOperatorOperator, TSTypeReference, TSUnionType,
};
use oxc_span::GetSpan;

use super::super::model::{InterfaceDecl, TypeAliasDecl, TypeExpr};
use super::names::{property_name, slice_span, string_from_span, unquote};

pub(super) fn parse_interface(
    interface_decl: &oxc_allocator::Box<'_, TSInterfaceDeclaration<'_>>,
    source: &str,
) -> InterfaceDecl {
    let extends = interface_decl
        .extends
        .iter()
        .map(|heritage| {
            let args = heritage
                .type_arguments
                .as_ref()
                .map(|instantiation| {
                    instantiation
                        .params
                        .iter()
                        .map(|a| parse_type_expr_with_source(a, source))
                        .collect::<Vec<_>>()
                })
                .unwrap_or_default();

            TypeExpr::Reference {
                name: slice_span(source, heritage.expression.span()).to_string(),
                args,
            }
        })
        .collect::<Vec<_>>();

    let props = interface_decl
        .body
        .body
        .iter()
        .filter_map(|signature| match signature {
            TSSignature::TSPropertySignature(property) => property_name(&property.key, source),
            _ => None,
        })
        .collect::<BTreeSet<_>>();

    InterfaceDecl {
        name: interface_decl.id.name.to_string(),
        type_params: type_params(interface_decl.type_parameters.as_deref()),
        extends,
        props,
    }
}

pub(super) fn parse_type_alias(
    type_alias: &oxc_allocator::Box<'_, TSTypeAliasDeclaration<'_>>,
    source: &str,
) -> TypeAliasDecl {
    TypeAliasDecl {
        name: type_alias.id.name.to_string(),
        type_params: type_params(type_alias.type_parameters.as_deref()),
        expr: parse_type_expr_with_source(&type_alias.type_annotation, source),
    }
}

/// Object literals, intersections and parenthesized types first, then the union, literal and
/// reference forms, then the computed forms.
fn parse_type_expr_with_source(type_annotation: &TSType<'_>, source: &str) -> TypeExpr {
    match type_annotation {
        TSType::TSTypeLiteral(type_literal) => parse_type_literal(type_literal, source),
        TSType::TSIntersectionType(intersection) => parse_intersection_type(intersection, source),
        TSType::TSParenthesizedType(parenthesized) => {
            parse_type_expr_with_source(&parenthesized.type_annotation, source)
        }
        _ => parse_type_form(type_annotation, source),
    }
}

fn parse_type_form(type_annotation: &TSType<'_>, source: &str) -> TypeExpr {
    match type_annotation {
        TSType::TSUnionType(union) => parse_union_type(union, source),
        TSType::TSLiteralType(_) => literal_type_expr(type_annotation, source),
        TSType::TSTypeReference(reference) => parse_reference_type(reference, source),
        _ => parse_computed_form(type_annotation, source),
    }
}

/// Indexed access, mapped, `keyof` and conditional types. Every keyword and unlisted form is
/// `Unknown`.
fn parse_computed_form(type_annotation: &TSType<'_>, source: &str) -> TypeExpr {
    match type_annotation {
        TSType::TSIndexedAccessType(indexed_access) => {
            parse_indexed_access_type(indexed_access, source)
        }
        TSType::TSMappedType(mapped) => parse_mapped_type(mapped, source),
        TSType::TSTypeOperatorType(operator) => parse_type_operator(operator, source),
        TSType::TSConditionalType(conditional) => parse_conditional_type(conditional, source),
        _ => TypeExpr::Unknown,
    }
}

fn literal_type_expr(type_annotation: &TSType<'_>, source: &str) -> TypeExpr {
    literal_value(type_annotation, source)
        .map(|value| TypeExpr::UnionLiterals(BTreeSet::from([value])))
        .unwrap_or(TypeExpr::Unknown)
}

fn parse_type_operator(
    operator: &oxc_allocator::Box<'_, TSTypeOperator<'_>>,
    source: &str,
) -> TypeExpr {
    match operator.operator {
        TSTypeOperatorOperator::Keyof => TypeExpr::Keyof(Box::new(parse_type_expr_with_source(
            &operator.type_annotation,
            source,
        ))),
        _ => TypeExpr::Unknown,
    }
}

fn parse_type_literal(
    type_literal: &oxc_allocator::Box<'_, TSTypeLiteral<'_>>,
    source: &str,
) -> TypeExpr {
    TypeExpr::Object(
        type_literal
            .members
            .iter()
            .filter_map(|signature| match signature {
                TSSignature::TSPropertySignature(property) => property_name(&property.key, source),
                _ => None,
            })
            .collect(),
    )
}

fn parse_intersection_type(
    intersection: &oxc_allocator::Box<'_, TSIntersectionType<'_>>,
    source: &str,
) -> TypeExpr {
    TypeExpr::Intersection(
        intersection
            .types
            .iter()
            .map(|nested| parse_type_expr_with_source(nested, source))
            .collect(),
    )
}

fn parse_union_type(union: &oxc_allocator::Box<'_, TSUnionType<'_>>, source: &str) -> TypeExpr {
    let (literals, mut members) = partition_union_members(union, source);
    if members.is_empty() {
        return without_members(literals);
    }
    if !literals.is_empty() {
        members.push(TypeExpr::UnionLiterals(literals));
    }
    TypeExpr::Union(members)
}

fn partition_union_members(
    union: &oxc_allocator::Box<'_, TSUnionType<'_>>,
    source: &str,
) -> (BTreeSet<String>, Vec<TypeExpr>) {
    let mut literals = BTreeSet::new();
    let mut members = Vec::new();
    for nested in &union.types {
        match parse_type_expr_with_source(nested, source) {
            TypeExpr::UnionLiterals(values) => literals.extend(values),
            TypeExpr::Unknown => {}
            member => members.push(member),
        }
    }
    (literals, members)
}

fn without_members(literals: BTreeSet<String>) -> TypeExpr {
    if literals.is_empty() {
        TypeExpr::Unknown
    } else {
        TypeExpr::UnionLiterals(literals)
    }
}

fn parse_reference_type(
    reference: &oxc_allocator::Box<'_, TSTypeReference<'_>>,
    source: &str,
) -> TypeExpr {
    TypeExpr::Reference {
        name: slice_span(source, reference.type_name.span()).to_string(),
        args: reference
            .type_arguments
            .as_ref()
            .map(|instantiation| {
                instantiation
                    .params
                    .iter()
                    .map(|arg| parse_type_expr_with_source(arg, source))
                    .collect()
            })
            .unwrap_or_default(),
    }
}

fn parse_indexed_access_type(
    indexed_access: &oxc_allocator::Box<'_, TSIndexedAccessType<'_>>,
    source: &str,
) -> TypeExpr {
    TypeExpr::IndexedAccess {
        object: Box::new(parse_type_expr_with_source(
            &indexed_access.object_type,
            source,
        )),
        index: Box::new(parse_type_expr_with_source(
            &indexed_access.index_type,
            source,
        )),
    }
}

fn parse_mapped_type(mapped: &oxc_allocator::Box<'_, TSMappedType<'_>>, source: &str) -> TypeExpr {
    TypeExpr::Mapped {
        key_source: Box::new(parse_type_expr_with_source(&mapped.constraint, source)),
        value_type: Box::new(
            mapped
                .type_annotation
                .as_ref()
                .map(|value| parse_type_expr_with_source(value, source))
                .unwrap_or(TypeExpr::Unknown),
        ),
    }
}

fn parse_conditional_type(
    conditional: &oxc_allocator::Box<'_, TSConditionalType<'_>>,
    source: &str,
) -> TypeExpr {
    TypeExpr::Conditional {
        true_type: Box::new(parse_type_expr_with_source(&conditional.true_type, source)),
        false_type: Box::new(parse_type_expr_with_source(&conditional.false_type, source)),
    }
}

fn literal_value(type_annotation: &TSType<'_>, source: &str) -> Option<String> {
    match type_annotation {
        TSType::TSLiteralType(literal) => literal_from_ts_literal(&literal.literal, source),
        TSType::TSParenthesizedType(parenthesized) => {
            literal_value(&parenthesized.type_annotation, source)
        }
        _ => None,
    }
}

fn literal_from_ts_literal(literal: &TSLiteral<'_>, source: &str) -> Option<String> {
    let raw = string_from_span(source, literal.span());
    Some(unquote(&raw))
}

fn type_params(params: Option<&oxc_ast::ast::TSTypeParameterDeclaration<'_>>) -> Vec<String> {
    params
        .map(|params| {
            params
                .params
                .iter()
                .map(|param| param.name.name.to_string())
                .collect::<Vec<_>>()
        })
        .unwrap_or_default()
}

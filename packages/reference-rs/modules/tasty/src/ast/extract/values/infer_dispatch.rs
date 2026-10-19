//! Expression-level dispatch for const value inference.
//! Routes initializer expressions into the infer helpers with const-assertion context.

use oxc_ast::ast::{
    Argument, CallExpression, Expression, ObjectExpression, ObjectPropertyKind, PropertyKind,
};
use oxc_span::GetSpan;

use super::super::infer::{
    infer_array_type, infer_boolean_type_span, infer_numeric_type_span, infer_object_type,
    infer_string_type_span,
};
use super::super::ExtractionContext;
use super::ts_assertions::{infer_ts_as_expression, infer_ts_satisfies_expression};
use crate::model::{FnParam, JsDoc, TsMember, TsMemberKind, TypeRef};
use crate::shared::type_ref_util::property_key_name;

/// Infers the type of a value expression. Objects, arrays and recipe calls are handled at the top of the chain;
/// literals and assertions are one step down, so each match stays within the arm budget.
pub(crate) fn infer_value_type_with_const_context(
    expression: &Expression<'_>,
    ctx: &ExtractionContext<'_>,
    const_asserted: bool,
) -> Option<TypeRef> {
    match expression {
        Expression::ObjectExpression(object) => infer_object_type(object, ctx, const_asserted),
        Expression::ArrayExpression(array) => infer_array_type(array, ctx, const_asserted),
        Expression::CallExpression(call) => infer_call_expression_type(call, ctx),
        other => infer_literal_expression_type(other, ctx, const_asserted),
    }
}

/// Literal expressions lower to their primitive or literal types.
fn infer_literal_expression_type(
    expression: &Expression<'_>,
    ctx: &ExtractionContext<'_>,
    const_asserted: bool,
) -> Option<TypeRef> {
    match expression {
        Expression::BooleanLiteral(_) => Some(infer_boolean_type_span(
            ctx.source,
            expression.span(),
            const_asserted,
        )),
        Expression::NullLiteral(_) => Some(TypeRef::Intrinsic {
            name: "null".to_string(),
        }),
        Expression::NumericLiteral(_) => Some(infer_numeric_type_span(
            ctx.source,
            expression.span(),
            const_asserted,
        )),
        Expression::StringLiteral(_) => Some(infer_string_type_span(
            ctx.source,
            expression.span(),
            const_asserted,
        )),
        other => infer_asserted_expression_type(other, ctx, const_asserted),
    }
}

/// A type assertion or `satisfies` expression lowers to the type of its inner expression.
fn infer_asserted_expression_type(
    expression: &Expression<'_>,
    ctx: &ExtractionContext<'_>,
    const_asserted: bool,
) -> Option<TypeRef> {
    match expression {
        Expression::TSAsExpression(assertion) => {
            infer_ts_as_expression(assertion, ctx, const_asserted)
        }
        Expression::TSSatisfiesExpression(satisfies) => {
            infer_ts_satisfies_expression(satisfies, ctx, const_asserted)
        }
        _ => None,
    }
}

fn infer_call_expression_type(
    call: &CallExpression<'_>,
    ctx: &ExtractionContext<'_>,
) -> Option<TypeRef> {
    if !is_recipe_factory_call(call, ctx) {
        return None;
    }

    let config = recipe_config_object(call)?;
    let selection = infer_recipe_selection_object(config, ctx)?;
    Some(TypeRef::Function {
        params: vec![FnParam {
            name: Some("props".to_string()),
            optional: true,
            type_ref: Some(selection),
        }],
        return_type: Box::new(TypeRef::Intrinsic {
            name: "string".to_string(),
        }),
    })
}

/// The first argument of a recipe call that is an object literal. A spread argument never qualifies.
fn recipe_config_object<'x, 'a>(call: &'x CallExpression<'a>) -> Option<&'x ObjectExpression<'a>> {
    call.arguments.iter().find_map(argument_object)
}

fn argument_object<'x, 'a>(argument: &'x Argument<'a>) -> Option<&'x ObjectExpression<'a>> {
    if matches!(argument, Argument::SpreadElement(_)) {
        return None;
    }

    match argument.to_expression().get_inner_expression() {
        Expression::ObjectExpression(object) => Some(object.as_ref()),
        _ => None,
    }
}

fn is_recipe_factory_call(call: &CallExpression<'_>, ctx: &ExtractionContext<'_>) -> bool {
    let Expression::Identifier(identifier) = call.callee.get_inner_expression() else {
        return false;
    };

    let Some(binding) = ctx.import_bindings.get(identifier.name.as_str()) else {
        return false;
    };

    matches!(binding.imported_name.as_str(), "recipe" | "cva")
}

fn infer_recipe_selection_object(
    config: &ObjectExpression<'_>,
    ctx: &ExtractionContext<'_>,
) -> Option<TypeRef> {
    let variants = find_object_property(config, "variants", ctx)?;
    let mut members = Vec::new();

    for property in variants.properties.iter() {
        let ObjectPropertyKind::ObjectProperty(property) = property else {
            return None;
        };

        if property.kind != PropertyKind::Init || property.computed || property.method {
            return None;
        }

        let variant_name = property_key_name(&property.key, ctx.source)?;
        let Expression::ObjectExpression(options) = property.value.get_inner_expression() else {
            return None;
        };

        let option_names = collect_object_property_names(options, ctx)?;
        let variant_type = union_or_single(
            option_names
                .into_iter()
                .map(|option| TypeRef::Literal {
                    value: format!("'{option}'"),
                })
                .collect(),
        );

        members.push(TsMember {
            name: variant_name,
            optional: true,
            readonly: false,
            kind: TsMemberKind::Property,
            description: None,
            description_raw: None,
            jsdoc: Some(JsDoc {
                summary: None,
                tags: Vec::new(),
            }),
            type_ref: Some(variant_type),
        });
    }

    Some(TypeRef::Object { members })
}

fn find_object_property<'a>(
    object: &'a ObjectExpression<'a>,
    name: &str,
    ctx: &ExtractionContext<'_>,
) -> Option<&'a ObjectExpression<'a>> {
    object
        .properties
        .iter()
        .find_map(|property| named_object_literal_value(property, name, ctx))
}

/// The object-literal value of a plain `key: { ... }` property with the given key. Methods, computed keys,
/// spreads, and every other value shape yield `None`.
fn named_object_literal_value<'a>(
    property: &'a ObjectPropertyKind<'a>,
    name: &str,
    ctx: &ExtractionContext<'_>,
) -> Option<&'a ObjectExpression<'a>> {
    let ObjectPropertyKind::ObjectProperty(property) = property else {
        return None;
    };

    if property.kind != PropertyKind::Init || property.computed || property.method {
        return None;
    }
    if property_key_name(&property.key, ctx.source)?.as_str() != name {
        return None;
    }

    match property.value.get_inner_expression() {
        Expression::ObjectExpression(object) => Some(object.as_ref()),
        _ => None,
    }
}

fn collect_object_property_names(
    object: &ObjectExpression<'_>,
    ctx: &ExtractionContext<'_>,
) -> Option<Vec<String>> {
    object
        .properties
        .iter()
        .map(|property| {
            let ObjectPropertyKind::ObjectProperty(property) = property else {
                return None;
            };

            if property.kind != PropertyKind::Init || property.computed || property.method {
                return None;
            }

            property_key_name(&property.key, ctx.source)
        })
        .collect()
}

fn union_or_single(types: Vec<TypeRef>) -> TypeRef {
    match types.as_slice() {
        [single] => single.clone(),
        _ => TypeRef::Union { types },
    }
}

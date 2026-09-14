//! Extraction of style calls: css(), css.raw(), cva(), sva(), recipe().
//!
//! Identifies style invocation sites within JavaScript and TypeScript source files.
//! Parses argument lists from atomic calls, recipes, and slot recipes into structured
//! property and variant declarations recorded through the extraction context.

use oxc_ast::ast::{
    Argument, ArrayExpression, CallExpression, Expression, ObjectExpression, ObjectProperty,
    ObjectPropertyKind, PropertyKey, StaticMemberExpression,
};
use smallvec::smallvec;

use crate::extract::leaves::walk_style_object;
use crate::extract::ExtractContext;

/// Inspect a CallExpression and extract style declarations from recognized functions.
pub fn handle_call_expression(call: &CallExpression<'_>, ctx: &mut ExtractContext<'_>) {
    let Some(callee_name) = resolve_callee_name(&call.callee) else {
        return;
    };

    match callee_name.as_str() {
        "css" | "css.raw" | "__reference_ui_css" => {
            handle_css_call(&callee_name, &call.arguments, ctx);
        }
        "cva" | "recipe" | "recipe.raw" | "__reference_ui_recipe" | "__reference_ui_cva" => {
            handle_recipe_call(&callee_name, &call.arguments, ctx);
        }
        "sva" => {
            handle_sva_call(&callee_name, &call.arguments, ctx);
        }
        _ => {}
    }
}

fn resolve_callee_name(callee: &Expression<'_>) -> Option<String> {
    match callee {
        Expression::Identifier(ident) => resolve_identifier_callee(ident.name.as_str()),
        Expression::StaticMemberExpression(member) => resolve_member_callee(member),
        _ => None,
    }
}

fn resolve_identifier_callee(name: &str) -> Option<String> {
    if matches!(
        name,
        "css"
            | "cva"
            | "sva"
            | "recipe"
            | "__reference_ui_css"
            | "__reference_ui_recipe"
            | "__reference_ui_cva"
    ) {
        Some(name.to_string())
    } else {
        None
    }
}

fn resolve_member_callee(member: &StaticMemberExpression<'_>) -> Option<String> {
    let prop = member.property.name.as_str();
    if prop == "raw" {
        return resolve_raw_member_callee(&member.object);
    }
    if matches!(prop, "css" | "cva" | "sva" | "recipe") {
        Some(prop.to_string())
    } else {
        None
    }
}

fn resolve_raw_member_callee(obj: &Expression<'_>) -> Option<String> {
    if let Expression::Identifier(ident) = obj {
        let name = ident.name.as_str();
        if name == "css" || name == "recipe" {
            return Some(format!("{name}.raw"));
        }
    }
    None
}

fn handle_css_call(callee_name: &str, args: &[Argument<'_>], ctx: &mut ExtractContext<'_>) {
    let origin = Some(callee_name);
    for arg in args {
        if let Some(expr) = arg.as_expression() {
            handle_css_arg(expr, origin, ctx);
        }
    }
}

fn handle_css_arg(
    expr: &Expression<'_>,
    origin: Option<&str>,
    ctx: &mut ExtractContext<'_>,
) {
    match expr {
        Expression::ObjectExpression(obj) => {
            let mut obj_ctx = ctx.object_walk(origin, false);
            walk_style_object(&mut obj_ctx, obj, &smallvec![]);
        }
        Expression::ConditionalExpression(cond) => {
            handle_css_conditional(cond, origin, ctx);
        }
        _ => {}
    }
}

fn handle_css_conditional(
    cond: &oxc_ast::ast::ConditionalExpression<'_>,
    origin: Option<&str>,
    ctx: &mut ExtractContext<'_>,
) {
    if let Expression::ObjectExpression(obj) = &cond.consequent {
        let mut obj_ctx = ctx.object_walk(origin, false);
        walk_style_object(&mut obj_ctx, obj, &smallvec![]);
    }
    if let Expression::ObjectExpression(obj) = &cond.alternate {
        let mut obj_ctx = ctx.object_walk(origin, false);
        walk_style_object(&mut obj_ctx, obj, &smallvec![]);
    }
}

fn handle_recipe_call(
    callee_name: &str,
    args: &[Argument<'_>],
    ctx: &mut ExtractContext<'_>,
) {
    let Some(first_arg) = args.first().and_then(Argument::as_expression) else {
        return;
    };
    let Expression::ObjectExpression(obj) = first_arg else {
        return;
    };

    let origin = Some(callee_name);
    for prop_kind in &obj.properties {
        if let ObjectPropertyKind::ObjectProperty(prop) = prop_kind {
            handle_recipe_property(prop, origin, ctx);
        }
    }
}

fn handle_recipe_property(
    prop: &ObjectProperty<'_>,
    origin: Option<&str>,
    ctx: &mut ExtractContext<'_>,
) {
    let PropertyKey::StaticIdentifier(ident) = &prop.key else {
        return;
    };
    match ident.name.as_str() {
        "base" => handle_recipe_base(&prop.value, origin, ctx),
        "variants" => handle_recipe_variants(&prop.value, origin, ctx),
        "compoundVariants" => {
            handle_recipe_compounds(&prop.value, origin, ctx);
        }
        _ => {}
    }
}

fn handle_recipe_base(
    val: &Expression<'_>,
    origin: Option<&str>,
    ctx: &mut ExtractContext<'_>,
) {
    if let Expression::ObjectExpression(base_obj) = val {
        let mut obj_ctx = ctx.object_walk(origin, false);
        walk_style_object(&mut obj_ctx, base_obj, &smallvec![]);
    }
}

fn handle_recipe_variants(
    val: &Expression<'_>,
    origin: Option<&str>,
    ctx: &mut ExtractContext<'_>,
) {
    if let Expression::ObjectExpression(variants_obj) = val {
        walk_variants_object(variants_obj, origin, ctx);
    }
}

fn handle_recipe_compounds(
    val: &Expression<'_>,
    origin: Option<&str>,
    ctx: &mut ExtractContext<'_>,
) {
    if let Expression::ArrayExpression(arr) = val {
        walk_compound_variants(arr, origin, ctx);
    }
}

fn walk_variants_object(
    obj: &ObjectExpression<'_>,
    origin: Option<&str>,
    ctx: &mut ExtractContext<'_>,
) {
    for group_kind in &obj.properties {
        let ObjectPropertyKind::ObjectProperty(group_prop) = group_kind else {
            continue;
        };
        let Expression::ObjectExpression(items_obj) = &group_prop.value else {
            continue;
        };
        walk_variant_items(items_obj, origin, ctx);
    }
}

fn walk_variant_items(
    items_obj: &ObjectExpression<'_>,
    origin: Option<&str>,
    ctx: &mut ExtractContext<'_>,
) {
    for item_kind in &items_obj.properties {
        let ObjectPropertyKind::ObjectProperty(item_prop) = item_kind else {
            continue;
        };
        if let Expression::ObjectExpression(style_obj) = &item_prop.value {
            let mut obj_ctx = ctx.object_walk(origin, false);
            walk_style_object(&mut obj_ctx, style_obj, &smallvec![]);
        }
    }
}

fn walk_compound_variants(
    arr: &ArrayExpression<'_>,
    origin: Option<&str>,
    ctx: &mut ExtractContext<'_>,
) {
    for elem in &arr.elements {
        let Some(Expression::ObjectExpression(item_obj)) = elem.as_expression() else {
            continue;
        };
        extract_compound_css(item_obj, origin, ctx);
    }
}

fn extract_compound_css(
    item_obj: &ObjectExpression<'_>,
    origin: Option<&str>,
    ctx: &mut ExtractContext<'_>,
) {
    for prop_kind in &item_obj.properties {
        let ObjectPropertyKind::ObjectProperty(p) = prop_kind else {
            continue;
        };
        let PropertyKey::StaticIdentifier(ident) = &p.key else {
            continue;
        };
        if ident.name == "css" {
            if let Expression::ObjectExpression(css_obj) = &p.value {
                let mut obj_ctx = ctx.object_walk(origin, false);
                walk_style_object(&mut obj_ctx, css_obj, &smallvec![]);
            }
        }
    }
}

fn handle_sva_call(callee_name: &str, args: &[Argument<'_>], ctx: &mut ExtractContext<'_>) {
    let Some(first_arg) = args.first().and_then(Argument::as_expression) else {
        return;
    };
    let Expression::ObjectExpression(obj) = first_arg else {
        return;
    };

    let origin = Some(callee_name);
    for prop_kind in &obj.properties {
        if let ObjectPropertyKind::ObjectProperty(prop) = prop_kind {
            handle_sva_property(prop, origin, ctx);
        }
    }
}

fn handle_sva_property(
    prop: &ObjectProperty<'_>,
    origin: Option<&str>,
    ctx: &mut ExtractContext<'_>,
) {
    let PropertyKey::StaticIdentifier(ident) = &prop.key else {
        return;
    };
    if ident.name == "base" {
        if let Expression::ObjectExpression(base_slots) = &prop.value {
            walk_sva_base_slots(base_slots, origin, ctx);
        }
    }
}

fn walk_sva_base_slots(
    slots: &ObjectExpression<'_>,
    origin: Option<&str>,
    ctx: &mut ExtractContext<'_>,
) {
    for slot_kind in &slots.properties {
        let ObjectPropertyKind::ObjectProperty(slot) = slot_kind else {
            continue;
        };
        if let Expression::ObjectExpression(style_obj) = &slot.value {
            let mut obj_ctx = ctx.object_walk(origin, false);
            walk_style_object(&mut obj_ctx, style_obj, &smallvec![]);
        }
    }
}

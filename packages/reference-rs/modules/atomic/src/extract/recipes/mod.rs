//! Extract `recipe()` / `recipe.raw()` style objects into wants.
//! Walks `base`, variant items, and `compoundVariants[].css` through the expression walker.
//! Does not emit closed recipe classes — that is a later pass, still unproven.

use oxc_ast::ast::{
    ArrayExpression, CallExpression, Expression, ObjectExpression, ObjectProperty,
    ObjectPropertyKind, PropertyKey, StaticMemberExpression,
};
use smallvec::smallvec;

use crate::extract::expressions::walk_style_object;
use crate::extract::ExtractContext;

/// Extract style objects from a `recipe(...)` call. No-ops if the callee is not recipe.
pub fn extract(call: &CallExpression<'_>, ctx: &mut ExtractContext<'_>) {
    // recipe({ base: { color: 'white' }, variants: { size: { sm: { fontSize: '12px' } } } })
    let Some(origin) = recipe_callee_name(&call.callee) else {
        return;
    };
    let Some(first_arg) = call.arguments.first().and_then(|arg| arg.as_expression()) else {
        return;
    };
    let Expression::ObjectExpression(obj) = first_arg else {
        return;
    };
    walk_recipe_object(obj, Some(origin.as_str()), ctx);
}

fn recipe_callee_name(callee: &Expression<'_>) -> Option<String> {
    match callee {
        Expression::Identifier(ident) => {
            // recipe({ ... })
            recipe_identifier_name(ident.name.as_str())
        }
        Expression::StaticMemberExpression(member) => {
            // recipe.raw({ ... }) / styled.recipe({ ... })
            recipe_member_name(member)
        }
        _ => None,
    }
}

fn recipe_identifier_name(name: &str) -> Option<String> {
    // recipe({ ... }) / __reference_ui_recipe({ ... })
    if matches!(name, "recipe" | "__reference_ui_recipe") {
        Some(name.to_string())
    } else {
        None
    }
}

fn recipe_member_name(member: &StaticMemberExpression<'_>) -> Option<String> {
    let prop = member.property.name.as_str();
    if prop == "raw" {
        // recipe.raw({ base: { color: 'white' } })
        return recipe_raw_member_name(&member.object);
    }
    if prop == "recipe" {
        // styled.recipe({ ... })
        return Some("recipe".to_string());
    }
    None
}

fn recipe_raw_member_name(obj: &Expression<'_>) -> Option<String> {
    // recipe.raw({ base: { color: 'white' } })
    if let Expression::Identifier(ident) = obj {
        if ident.name.as_str() == "recipe" {
            return Some("recipe.raw".to_string());
        }
    }
    None
}

fn walk_recipe_object(
    obj: &ObjectExpression<'_>,
    origin: Option<&str>,
    ctx: &mut ExtractContext<'_>,
) {
    // { base, variants, compoundVariants }
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
        "base" => {
            // base: { color: 'white' }
            walk_style_value(&prop.value, origin, ctx)
        }
        "variants" => {
            // variants: { size: { sm: { fontSize: '12px' } } }
            handle_recipe_variants(&prop.value, origin, ctx)
        }
        "compoundVariants" => {
            // compoundVariants: [{ variant: 'solid', css: { opacity: '0.9' } }]
            handle_recipe_compounds(&prop.value, origin, ctx)
        }
        _ => {}
    }
}

fn walk_style_value(val: &Expression<'_>, origin: Option<&str>, ctx: &mut ExtractContext<'_>) {
    // { color: 'white' }  — a recipe style object
    if let Expression::ObjectExpression(obj) = val {
        let mut obj_ctx = ctx.object_walk(origin, false);
        walk_style_object(&mut obj_ctx, obj, &smallvec![]);
    }
}

fn handle_recipe_variants(
    val: &Expression<'_>,
    origin: Option<&str>,
    ctx: &mut ExtractContext<'_>,
) {
    // variants: { size: { sm: { fontSize: '12px' }, lg: { fontSize: '18px' } } }
    let Expression::ObjectExpression(variants_obj) = val else {
        return;
    };
    for group_kind in &variants_obj.properties {
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
    // { sm: { fontSize: '12px' }, lg: { fontSize: '18px' } }
    for item_kind in &items_obj.properties {
        let ObjectPropertyKind::ObjectProperty(item_prop) = item_kind else {
            continue;
        };
        walk_style_value(&item_prop.value, origin, ctx);
    }
}

fn handle_recipe_compounds(
    val: &Expression<'_>,
    origin: Option<&str>,
    ctx: &mut ExtractContext<'_>,
) {
    // compoundVariants: [{ variant: 'solid', css: { opacity: '0.9' } }]
    let Expression::ArrayExpression(arr) = val else {
        return;
    };
    walk_compound_variants(arr, origin, ctx);
}

fn walk_compound_variants(
    arr: &ArrayExpression<'_>,
    origin: Option<&str>,
    ctx: &mut ExtractContext<'_>,
) {
    // [{ variant: 'solid', css: { opacity: '0.9' } }]
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
    // { variant: 'solid', css: { opacity: '0.9' } }
    for prop_kind in &item_obj.properties {
        let ObjectPropertyKind::ObjectProperty(p) = prop_kind else {
            continue;
        };
        let PropertyKey::StaticIdentifier(ident) = &p.key else {
            continue;
        };
        if ident.name == "css" {
            // css: { opacity: '0.9' }
            walk_style_value(&p.value, origin, ctx);
        }
    }
}

//! Extract `recipe()` / `recipe.raw()` into Recipe IR, not utility wants.
//! Walks `className`, `base`, variant items, and `compoundVariants[].css`
//! through the expression walker into per-leaf want lists. Closed classes and
//! the variant table are `src/recipes`. `sva` is not a site.

use indexmap::IndexMap;
use oxc_ast::ast::{
    ArrayExpression, CallExpression, Expression, ObjectExpression, ObjectProperty,
    ObjectPropertyKind, PropertyKey,
};
use smallvec::smallvec;

use crate::atom::Want;
use crate::extract::expressions::walk_style_object;
use crate::extract::ExtractContext;
use crate::recipes::{name, Recipe, RecipeCompound};

/// Collect a live Reference `recipe(...)` call into `ctx.recipes`.
pub fn extract(call: &CallExpression<'_>, ctx: &mut ExtractContext<'_>) {
    let Some(origin) = ctx.bindings.recipe_origin(&call.callee, ctx.shadowed) else {
        return;
    };
    let Some(first_arg) = call.arguments.first().and_then(|arg| arg.as_expression()) else {
        return;
    };
    let Expression::ObjectExpression(obj) = first_arg else {
        return;
    };
    let draft = walk_recipe_object(obj, origin.as_str(), ctx);
    ctx.recipes
        .push(finish_recipe(draft, ctx.recipe_binding.as_deref()));
}

#[derive(Default)]
struct RecipeDraft {
    class_name: Option<String>,
    base: Vec<Want>,
    variants: IndexMap<String, IndexMap<String, Vec<Want>>>,
    compounds: Vec<RecipeCompound>,
}

fn finish_recipe(draft: RecipeDraft, binding: Option<&str>) -> Recipe {
    let class_name = name::stem(draft.class_name.as_deref(), binding);
    let recipe_name = binding
        .filter(|name| !name.is_empty())
        .unwrap_or(class_name.as_str())
        .to_string();
    Recipe {
        name: recipe_name,
        class_name,
        base: draft.base,
        variants: draft.variants,
        compounds: draft.compounds,
    }
}

fn walk_recipe_object(
    obj: &ObjectExpression<'_>,
    origin: &str,
    ctx: &mut ExtractContext<'_>,
) -> RecipeDraft {
    let mut draft = RecipeDraft::default();
    for prop_kind in &obj.properties {
        if let ObjectPropertyKind::ObjectProperty(prop) = prop_kind {
            handle_recipe_property(prop, origin, ctx, &mut draft);
        }
    }
    draft
}

struct RecipeWalk<'a, 'b> {
    origin: &'a str,
    ctx: &'a mut ExtractContext<'b>,
    draft: &'a mut RecipeDraft,
}

fn handle_recipe_property(
    prop: &ObjectProperty<'_>,
    origin: &str,
    ctx: &mut ExtractContext<'_>,
    draft: &mut RecipeDraft,
) {
    let Some(key) = static_key(&prop.key) else {
        return;
    };
    match key.as_str() {
        "className" => draft.class_name = string_literal(&prop.value),
        "base" => walk_style_into(&prop.value, origin, ctx, &mut draft.base),
        "variants" => handle_recipe_variants(&prop.value, origin, ctx, draft),
        "compoundVariants" => handle_recipe_compounds(&prop.value, origin, ctx, draft),
        _ => {}
    }
}

fn walk_style_into(
    val: &Expression<'_>,
    origin: &str,
    ctx: &mut ExtractContext<'_>,
    wants: &mut Vec<Want>,
) {
    let Expression::ObjectExpression(obj) = val else {
        return;
    };
    let mut obj_ctx = ctx.object_walk_into(Some(origin), wants);
    walk_style_object(&mut obj_ctx, obj, &smallvec![]);
}

fn handle_recipe_variants(
    val: &Expression<'_>,
    origin: &str,
    ctx: &mut ExtractContext<'_>,
    draft: &mut RecipeDraft,
) {
    let Expression::ObjectExpression(variants_obj) = val else {
        return;
    };
    let mut walk = RecipeWalk { origin, ctx, draft };
    for group_kind in &variants_obj.properties {
        let ObjectPropertyKind::ObjectProperty(group_prop) = group_kind else {
            continue;
        };
        let Some(group_name) = static_key(&group_prop.key) else {
            continue;
        };
        let Expression::ObjectExpression(items_obj) = &group_prop.value else {
            continue;
        };
        walk_variant_items(&mut walk, items_obj, &group_name);
    }
}

fn walk_variant_items(
    walk: &mut RecipeWalk<'_, '_>,
    items_obj: &ObjectExpression<'_>,
    group_name: &str,
) {
    let mut items = IndexMap::new();
    for item_kind in &items_obj.properties {
        let ObjectPropertyKind::ObjectProperty(item_prop) = item_kind else {
            continue;
        };
        let Some(value_name) = static_key(&item_prop.key) else {
            continue;
        };
        let mut wants = Vec::new();
        walk_style_into(&item_prop.value, walk.origin, walk.ctx, &mut wants);
        items.insert(value_name, wants);
    }
    walk.draft.variants.insert(group_name.to_string(), items);
}

fn handle_recipe_compounds(
    val: &Expression<'_>,
    origin: &str,
    ctx: &mut ExtractContext<'_>,
    draft: &mut RecipeDraft,
) {
    let Expression::ArrayExpression(arr) = val else {
        return;
    };
    walk_compound_variants(arr, origin, ctx, draft);
}

fn walk_compound_variants(
    arr: &ArrayExpression<'_>,
    origin: &str,
    ctx: &mut ExtractContext<'_>,
    draft: &mut RecipeDraft,
) {
    for elem in &arr.elements {
        let Some(Expression::ObjectExpression(item_obj)) = elem.as_expression() else {
            continue;
        };
        if let Some(compound) = extract_compound(item_obj, origin, ctx) {
            draft.compounds.push(compound);
        }
    }
}

fn extract_compound(
    item_obj: &ObjectExpression<'_>,
    origin: &str,
    ctx: &mut ExtractContext<'_>,
) -> Option<RecipeCompound> {
    let mut props = IndexMap::new();
    let mut wants = Vec::new();
    for prop_kind in &item_obj.properties {
        let ObjectPropertyKind::ObjectProperty(prop) = prop_kind else {
            continue;
        };
        let Some(key) = static_key(&prop.key) else {
            continue;
        };
        if key == "css" {
            walk_style_into(&prop.value, origin, ctx, &mut wants);
            continue;
        }
        if let Some(value) = string_literal(&prop.value) {
            props.insert(key, value);
        }
    }
    if wants.is_empty() {
        return None;
    }
    Some(RecipeCompound { props, wants })
}

fn static_key(key: &PropertyKey<'_>) -> Option<String> {
    match key {
        PropertyKey::StaticIdentifier(ident) => Some(ident.name.to_string()),
        PropertyKey::StringLiteral(lit) => Some(lit.value.to_string()),
        _ => None,
    }
}

fn string_literal(expr: &Expression<'_>) -> Option<String> {
    if let Expression::StringLiteral(lit) = expr {
        return Some(lit.value.to_string());
    }
    if let Expression::BooleanLiteral(lit) = expr {
        return Some(lit.value.to_string());
    }
    if let Expression::NumericLiteral(lit) = expr {
        return Some(numeric_key(lit.value));
    }
    static_template_string(expr)
}

fn static_template_string(expr: &Expression<'_>) -> Option<String> {
    let Expression::TemplateLiteral(lit) = expr else {
        return None;
    };
    if !lit.expressions.is_empty() {
        return None;
    }
    lit.quasis.first().map(|q| q.value.raw.to_string())
}

fn numeric_key(n: f64) -> String {
    if n.fract() == 0.0 {
        format!("{}", n as i64)
    } else {
        n.to_string()
    }
}

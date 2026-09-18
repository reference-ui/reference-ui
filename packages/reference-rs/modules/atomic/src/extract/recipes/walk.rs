//! Recipe object walker: base styles, variant matrices, defaults, and compounds.
//! Takes a validated recipe object literal plus its origin and emits a
//! `RecipeDraft` of style wants. Identity refusal (className, spreads,
//! non-object args) stays in `mod.rs`; this file only walks well-formed
//! leaves into wants.

use indexmap::IndexMap;
use oxc_ast::ast::{
    ArrayExpression, Expression, ObjectExpression, ObjectProperty, ObjectPropertyKind,
    PropertyKey,
};
use smallvec::smallvec;

use crate::atom::Want;
use crate::extract::expressions::walk_style_object;
use crate::extract::ExtractContext;
use crate::recipes::RecipeCompound;

#[derive(Default)]
pub(crate) struct RecipeDraft {
    pub(crate) base: Vec<Want>,
    pub(crate) variants: IndexMap<String, IndexMap<String, Vec<Want>>>,
    pub(crate) default_variants: IndexMap<String, String>,
    pub(crate) compounds: Vec<RecipeCompound>,
}

pub(crate) fn walk_recipe_object(
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
        "base" => walk_style_into(&prop.value, origin, ctx, &mut draft.base),
        "variants" => handle_recipe_variants(&prop.value, origin, ctx, draft),
        "defaultVariants" => handle_recipe_defaults(&prop.value, draft),
        "compoundVariants" => handle_recipe_compounds(&prop.value, origin, ctx, draft),
        _ => {}
    }
}

fn handle_recipe_defaults(val: &Expression<'_>, draft: &mut RecipeDraft) {
    let Expression::ObjectExpression(obj) = unwrap_expression(val) else {
        return;
    };
    for prop_kind in &obj.properties {
        let ObjectPropertyKind::ObjectProperty(prop) = prop_kind else {
            continue;
        };
        let Some(key) = static_key(&prop.key) else {
            continue;
        };
        if let Some(str_val) = normalized_value(&prop.value) {
            draft.default_variants.insert(key, str_val);
        }
    }
}

fn walk_style_into(
    val: &Expression<'_>,
    origin: &str,
    ctx: &mut ExtractContext<'_>,
    wants: &mut Vec<Want>,
) {
    let Expression::ObjectExpression(obj) = unwrap_expression(val) else {
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
    let Expression::ObjectExpression(variants_obj) = unwrap_expression(val) else {
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
        let Expression::ObjectExpression(items_obj) = unwrap_expression(&group_prop.value) else {
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
        let Some(raw_val) = static_key(&item_prop.key) else {
            continue;
        };
        let value_name = raw_val;
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
    let Expression::ArrayExpression(arr) = unwrap_expression(val) else {
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
        let Some(expr) = elem.as_expression() else {
            continue;
        };
        let Expression::ObjectExpression(item_obj) = unwrap_expression(expr) else {
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
    let mut predicates = IndexMap::new();
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
        extract_compound_predicate(&prop.value, key, &mut predicates);
    }
    if wants.is_empty() || predicates.is_empty() {
        return None;
    }
    Some(RecipeCompound { predicates, wants })
}

fn extract_compound_predicate(
    val: &Expression<'_>,
    key: String,
    predicates: &mut IndexMap<String, Vec<String>>,
) {
    let unwrapped = unwrap_expression(val);
    if let Expression::ArrayExpression(arr) = unwrapped {
        let values = extract_predicate_array(arr);
        if !values.is_empty() {
            predicates.insert(key, values);
        }
        return;
    }
    if let Some(s) = normalized_value(unwrapped) {
        predicates.insert(key, vec![s]);
    }
}

fn extract_predicate_array(arr: &ArrayExpression<'_>) -> Vec<String> {
    let mut values = Vec::new();
    for el in &arr.elements {
        if let Some(expr) = el.as_expression() {
            if let Some(s) = normalized_value(expr) {
                values.push(s);
            }
        }
    }
    values
}

fn unwrap_paren<'a, 'b>(expr: &'b Expression<'a>) -> Option<&'b Expression<'a>> {
    match expr {
        Expression::ParenthesizedExpression(p) => Some(&p.expression),
        _ => None,
    }
}

fn unwrap_ts<'a, 'b>(expr: &'b Expression<'a>) -> Option<&'b Expression<'a>> {
    match expr {
        Expression::TSAsExpression(e) => Some(&e.expression),
        Expression::TSTypeAssertion(e) => Some(&e.expression),
        Expression::TSSatisfiesExpression(e) => Some(&e.expression),
        Expression::TSNonNullExpression(e) => Some(&e.expression),
        _ => None,
    }
}

fn unwrap_expression_once<'a, 'b>(expr: &'b Expression<'a>) -> Option<&'b Expression<'a>> {
    unwrap_paren(expr).or_else(|| unwrap_ts(expr))
}

pub(crate) fn unwrap_expression<'a, 'b>(mut expr: &'b Expression<'a>) -> &'b Expression<'a> {
    while let Some(inner) = unwrap_expression_once(expr) {
        expr = inner;
    }
    expr
}

pub(crate) fn static_key(key: &PropertyKey<'_>) -> Option<String> {
    match key {
        PropertyKey::StaticIdentifier(ident) => Some(ident.name.to_string()),
        PropertyKey::StringLiteral(lit) => Some(lit.value.to_string()),
        PropertyKey::NumericLiteral(lit) => Some(numeric_key(lit.value)),
        _ => None,
    }
}

fn boolean_str(val: bool) -> String {
    if val {
        "true".to_string()
    } else {
        "false".to_string()
    }
}

fn static_template_str(lit: &oxc_ast::ast::TemplateLiteral<'_>) -> Option<String> {
    if !lit.expressions.is_empty() {
        return None;
    }
    lit.quasis.first().map(|q| q.value.raw.to_string())
}

fn normalized_value(expr: &Expression<'_>) -> Option<String> {
    let unwrapped = unwrap_expression(expr);
    match unwrapped {
        Expression::StringLiteral(lit) => Some(lit.value.to_string()),
        Expression::BooleanLiteral(lit) => Some(boolean_str(lit.value)),
        Expression::NumericLiteral(lit) => Some(numeric_key(lit.value)),
        Expression::TemplateLiteral(lit) => static_template_str(lit),
        _ => None,
    }
}

fn numeric_key(n: f64) -> String {
    if n.fract() == 0.0 {
        format!("{}", n as i64)
    } else {
        n.to_string()
    }
}

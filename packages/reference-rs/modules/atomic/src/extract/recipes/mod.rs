//! AST extraction for Reference UI `recipe(...)` and `recipe.raw(...)` calls.
//! Validates explicit `className` string literals, variant matrices, and compound rules.
//! Extracts base styles, variant leaves, defaults, and multi-value compound predicates.
//! Admits identity from the prop or from a `<Name>Recipe` binding (core parity);
//! refuses dynamic or otherwise absent identity and enforces fail-closed compilation.

use oxc_ast::ast::{
    CallExpression, Expression, ObjectExpression, ObjectProperty, ObjectPropertyKind,
};
use oxc_span::{GetSpan, Span};

use crate::diagnostics::{line_col, Diagnostic, DiagnosticCode, DiagnosticLocation};
use crate::extract::ExtractContext;
use crate::recipes::Recipe;

mod walk;

/// Collect a live Reference `recipe(...)` call into `ctx.recipes`.
pub fn extract(call: &CallExpression<'_>, ctx: &mut ExtractContext<'_>) {
    let Some(origin) = ctx.bindings.recipe_origin(&call.callee, ctx.shadowed) else {
        return;
    };
    let Some(first_arg) = call.arguments.first().and_then(|arg| arg.as_expression()) else {
        ctx.diagnostics.push(located_error(
            ctx,
            DiagnosticCode::RecipeArgShape,
            "recipe(...) requires an inline object literal as its first argument",
            call.span,
        ));
        return;
    };
    let unwrapped = walk::unwrap_expression(first_arg);
    let Expression::ObjectExpression(obj) = unwrapped else {
        ctx.diagnostics.push(located_error(
            ctx,
            DiagnosticCode::RecipeArgShape,
            "recipe(...) requires an inline object literal as its first argument",
            first_arg.span(),
        ));
        return;
    };
    if let Some(spread) = first_spread(obj) {
        ctx.diagnostics.push(located_error(
            ctx,
            DiagnosticCode::RecipeSpread,
            "recipe(...) object literal must not contain spread properties",
            spread.span,
        ));
        return;
    }
    let Some(class_name) = extract_class_name(obj, ctx) else {
        return;
    };
    let draft = walk::walk_recipe_object(obj, origin.as_str(), ctx);
    ctx.recipes.push(Recipe {
        class_name,
        base: draft.base,
        variants: draft.variants,
        default_variants: draft.default_variants,
        compounds: draft.compounds,
        location: call_location(ctx, call.span),
    });
}

/// Error diagnostic at a span's file/line/column, like the wants from this pass.
fn located_error(
    ctx: &ExtractContext<'_>,
    code: DiagnosticCode,
    message: &str,
    span: Span,
) -> Diagnostic {
    let (line, column) = ctx
        .source
        .and_then(|source| line_col(source, span.start))
        .unzip();
    Diagnostic::error(code, message).with_location(ctx.file, line, column)
}

/// Source call site for a collected recipe, carried for refusal diagnostics.
fn call_location(ctx: &ExtractContext<'_>, span: Span) -> DiagnosticLocation {
    let (line, column) = ctx
        .source
        .and_then(|source| line_col(source, span.start))
        .unzip();
    DiagnosticLocation {
        file: Some(ctx.file.to_string()),
        line,
        column,
    }
}

fn first_spread<'a, 'b>(
    obj: &'b ObjectExpression<'a>,
) -> Option<&'b oxc_ast::ast::SpreadElement<'a>> {
    obj.properties.iter().find_map(|prop| match prop {
        ObjectPropertyKind::SpreadProperty(spread) => Some(spread.as_ref()),
        _ => None,
    })
}

fn find_class_name_prop<'a, 'b>(obj: &'b ObjectExpression<'a>) -> Option<&'b ObjectProperty<'a>> {
    for p in &obj.properties {
        if let ObjectPropertyKind::ObjectProperty(prop) = p {
            if walk::static_key(&prop.key).as_deref() == Some("className") {
                return Some(prop);
            }
        }
    }
    None
}

fn extract_class_name(obj: &ObjectExpression<'_>, ctx: &mut ExtractContext<'_>) -> Option<String> {
    if let Some(prop) = find_class_name_prop(obj) {
        return extract_literal_class_name(prop, ctx);
    }
    if let Some(derived) = infer_binding_class_name(ctx.recipe_binding) {
        return Some(derived);
    }
    ctx.diagnostics.push(located_error(
        ctx,
        DiagnosticCode::RecipeClassName,
        "recipe(...) requires an explicit string-literal 'className' property",
        obj.span,
    ));
    None
}

/// Derive the recipe stem from the enclosing declarator when it carries the
/// conventional `Recipe` suffix (`const chipRecipe = recipe(...)` → `chip`).
/// A bare `Recipe` binding or any other shape stays uninferrable by design.
fn infer_binding_class_name(binding: Option<&str>) -> Option<String> {
    let stem = binding?.strip_suffix("Recipe")?;
    if stem.is_empty() {
        return None;
    }
    Some(stem.to_string())
}

fn extract_literal_class_name(
    prop: &ObjectProperty<'_>,
    ctx: &mut ExtractContext<'_>,
) -> Option<String> {
    let unwrapped = walk::unwrap_expression(&prop.value);
    if let Expression::StringLiteral(lit) = unwrapped {
        if !lit.value.trim().is_empty() {
            return Some(lit.value.to_string());
        }
    }
    ctx.diagnostics.push(located_error(
        ctx,
        DiagnosticCode::RecipeClassName,
        "recipe(...) 'className' property must be a non-empty string literal",
        unwrapped.span(),
    ));
    None
}

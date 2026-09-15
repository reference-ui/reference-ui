//! Extract `css()` / `css.raw()` call arguments into wants.
//! Hands object and ternary-of-object arguments to the expression walker.
//! Does not walk `recipe()` and does not interpret JSX attributes.

use oxc_ast::ast::{CallExpression, Expression, StaticMemberExpression};
use smallvec::smallvec;

use crate::extract::expressions::walk_style_object;
use crate::extract::ExtractContext;

/// Extract style objects from a `css(...)` call. No-ops if the callee is not css.
pub fn extract(call: &CallExpression<'_>, ctx: &mut ExtractContext<'_>) {
    // css({ mt: '2r' }, { color: 'red' })
    let Some(origin) = css_callee_name(&call.callee) else {
        return;
    };
    for arg in &call.arguments {
        if let Some(expr) = arg.as_expression() {
            handle_css_arg(expr, Some(origin.as_str()), ctx);
        }
    }
}

fn css_callee_name(callee: &Expression<'_>) -> Option<String> {
    match callee {
        Expression::Identifier(ident) => {
            // css({ ... })
            css_identifier_name(ident.name.as_str())
        }
        Expression::StaticMemberExpression(member) => {
            // css.raw({ ... }) / styled.css({ ... })
            css_member_name(member)
        }
        _ => None,
    }
}

fn css_identifier_name(name: &str) -> Option<String> {
    // css({ ... }) / __reference_ui_css({ ... })
    if matches!(name, "css" | "__reference_ui_css") {
        Some(name.to_string())
    } else {
        None
    }
}

fn css_member_name(member: &StaticMemberExpression<'_>) -> Option<String> {
    let prop = member.property.name.as_str();
    if prop == "raw" {
        // css.raw({ p: '1r' })
        return css_raw_member_name(&member.object);
    }
    if prop == "css" {
        // styled.css({ mt: '2r' })
        return Some("css".to_string());
    }
    None
}

fn css_raw_member_name(obj: &Expression<'_>) -> Option<String> {
    // css.raw({ p: '1r' })
    if let Expression::Identifier(ident) = obj {
        if ident.name.as_str() == "css" {
            return Some("css.raw".to_string());
        }
    }
    None
}

fn handle_css_arg(expr: &Expression<'_>, origin: Option<&str>, ctx: &mut ExtractContext<'_>) {
    match expr {
        Expression::ObjectExpression(obj) => {
            // css({ color: 'red', _hover: { bg: 'n200' } })
            let mut obj_ctx = ctx.object_walk(origin, false);
            walk_style_object(&mut obj_ctx, obj, &smallvec![]);
        }
        Expression::ConditionalExpression(cond) => {
            // css(on ? { color: 'red' } : { color: 'blue' })
            walk_object_branch(&cond.consequent, origin, ctx);
            walk_object_branch(&cond.alternate, origin, ctx);
        }
        _ => {}
    }
}

fn walk_object_branch(expr: &Expression<'_>, origin: Option<&str>, ctx: &mut ExtractContext<'_>) {
    // { color: 'red' }  — one arm of css(on ? { ... } : { ... })
    let Expression::ObjectExpression(obj) = expr else {
        return;
    };
    let mut obj_ctx = ctx.object_walk(origin, false);
    walk_style_object(&mut obj_ctx, obj, &smallvec![]);
}

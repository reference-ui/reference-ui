//! JSX style prop extraction on Reference primitives and custom elements.
//!
//! Scans JSX element opening tags, inspecting attribute names against known style props
//! and condition keys. Dispatches style values directly into the leaf extraction context.

use oxc_ast::ast::{
    Expression, JSXAttribute, JSXAttributeItem, JSXAttributeName, JSXAttributeValue,
    JSXElementName, JSXExpressionContainer, JSXMemberExpression, JSXOpeningElement, StringLiteral,
};
use smallvec::smallvec;

use crate::canon::{is_condition_prop, is_known_style_prop};
use crate::atom::Want;
use crate::extract::ExtractContext;

/// Inspect a JSX opening element and extract all style-bearing attributes.
pub fn handle_jsx_opening_element(
    opening: &JSXOpeningElement<'_>,
    ctx: &mut ExtractContext<'_>,
) {
    let tag_name = format_jsx_element_name(&opening.name);
    let origin = Some(tag_name.as_str());

    for item in &opening.attributes {
        match item {
            JSXAttributeItem::Attribute(attr) => {
                handle_jsx_attribute(attr, origin, ctx);
            }
            JSXAttributeItem::SpreadAttribute(spread) => {
                if let Expression::ObjectExpression(obj) = &spread.argument {
                    let mut obj_ctx = ctx.object_walk(origin, false);
                    crate::extract::leaves::walk_style_object(&mut obj_ctx, obj, &smallvec![]);
                }
            }
        }
    }
}

fn handle_jsx_attribute(
    attr: &JSXAttribute<'_>,
    origin: Option<&str>,
    ctx: &mut ExtractContext<'_>,
) {
    let name = format_jsx_attribute_name(&attr.name);
    let Some(val) = &attr.value else {
        if is_known_style_prop(&name) {
            let want = Want::new(name, crate::atom::AtomValue::Bool(true)).with_origin(origin);
            ctx.wants.push(want);
        }
        return;
    };

    handle_attribute_value(&name, val, origin, ctx);
}

fn handle_attribute_value(
    name: &str,
    val: &JSXAttributeValue<'_>,
    origin: Option<&str>,
    ctx: &mut ExtractContext<'_>,
) {
    match val {
        JSXAttributeValue::StringLiteral(lit) => {
            handle_attribute_string(name, lit, origin, ctx);
        }
        JSXAttributeValue::ExpressionContainer(c) => {
            handle_attribute_container(name, c, origin, ctx);
        }
        _ => {}
    }
}

fn handle_attribute_string(
    name: &str,
    lit: &StringLiteral<'_>,
    origin: Option<&str>,
    ctx: &mut ExtractContext<'_>,
) {
    if is_known_style_prop(name) {
        let mut leaf_ctx = ctx.leaf_walk(name, origin, false);
        crate::extract::leaves::literal::push_string_want(&mut leaf_ctx, lit, &smallvec![]);
    }
}

fn handle_attribute_container(
    name: &str,
    container: &JSXExpressionContainer<'_>,
    origin: Option<&str>,
    ctx: &mut ExtractContext<'_>,
) {
    if let Some(expr) = container.expression.as_expression() {
        dispatch_attribute_expression(name, expr, origin, ctx);
    }
}

fn dispatch_attribute_expression(
    name: &str,
    expr: &Expression<'_>,
    origin: Option<&str>,
    ctx: &mut ExtractContext<'_>,
) {
    if name == "css" {
        if let Expression::ObjectExpression(obj) = expr {
            let mut obj_ctx = ctx.object_walk(origin, false);
            crate::extract::leaves::walk_style_object(&mut obj_ctx, obj, &smallvec![]);
        }
    } else if is_condition_prop(name) {
        if let Expression::ObjectExpression(obj) = expr {
            let when = smallvec![name.into()];
            let mut obj_ctx = ctx.object_walk(origin, false);
            crate::extract::leaves::walk_style_object(&mut obj_ctx, obj, &when);
        }
    } else if is_known_style_prop(name) {
        let mut leaf_ctx = ctx.leaf_walk(name, origin, false);
        crate::extract::leaves::walk_expression(&mut leaf_ctx, expr, &smallvec![]);
    }
}

fn format_jsx_element_name(name: &JSXElementName<'_>) -> String {
    match name {
        JSXElementName::Identifier(ident) => ident.name.to_string(),
        JSXElementName::IdentifierReference(ident) => ident.name.to_string(),
        JSXElementName::NamespacedName(ns) => format!("{}:{}", ns.namespace.name, ns.name.name),
        JSXElementName::MemberExpression(member) => format_jsx_member_expr(member),
        JSXElementName::ThisExpression(_) => "this".to_string(),
    }
}

fn format_jsx_member_expr(member: &JSXMemberExpression<'_>) -> String {
    format!(
        "{}.{}",
        format_jsx_member_object(&member.object),
        member.property.name
    )
}

fn format_jsx_member_object(object: &oxc_ast::ast::JSXMemberExpressionObject<'_>) -> String {
    match object {
        oxc_ast::ast::JSXMemberExpressionObject::IdentifierReference(ident) => {
            ident.name.to_string()
        }
        oxc_ast::ast::JSXMemberExpressionObject::MemberExpression(inner) => {
            format_jsx_member_expr(inner)
        }
        oxc_ast::ast::JSXMemberExpressionObject::ThisExpression(_) => "this".to_string(),
    }
}

fn format_jsx_attribute_name(name: &JSXAttributeName<'_>) -> String {
    match name {
        JSXAttributeName::Identifier(ident) => ident.name.to_string(),
        JSXAttributeName::NamespacedName(ns) => format!("{}:{}", ns.namespace.name, ns.name.name),
    }
}

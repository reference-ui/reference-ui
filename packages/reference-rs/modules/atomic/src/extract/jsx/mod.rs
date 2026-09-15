//! JSX StyleProps extraction on opening tags.
//!
//! Scans JSX attributes against known style props and condition keys.
//! The `r` prop object is walked through `resolve/r`, not as a scalar value.

use oxc_ast::ast::{
    Expression, JSXAttribute, JSXAttributeItem, JSXAttributeName, JSXAttributeValue,
    JSXElementName, JSXExpressionContainer, JSXMemberExpression, JSXOpeningElement, StringLiteral,
};
use smallvec::{smallvec, SmallVec};

use crate::atom::Want;
use crate::extract::ExtractContext;
use canon::{is_condition_prop, is_known_style_prop};

/// Extract style-bearing attributes from a JSX opening element.
pub fn extract(opening: &JSXOpeningElement<'_>, ctx: &mut ExtractContext<'_>) {
    // <Div mt="2r" css={{ color: 'red' }} r={{ md: { p: '1r' } }} />
    let tag_name = format_jsx_element_name(&opening.name);
    let origin = Some(tag_name.as_str());

    for item in &opening.attributes {
        match item {
            JSXAttributeItem::Attribute(attr) => {
                // <Div mt="2r" />
                handle_jsx_attribute(attr, origin, ctx);
            }
            JSXAttributeItem::SpreadAttribute(spread) => {
                // <Div {...{ mt: '2r', _hover: { color: 'red' } }} />
                if let Expression::ObjectExpression(obj) = &spread.argument {
                    let mut obj_ctx = ctx.object_walk(origin, false);
                    crate::extract::expressions::walk_style_object(&mut obj_ctx, obj, &smallvec![]);
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
        // <Div truncate />
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
            // <Div mt="2r" />
            handle_attribute_string(name, lit, origin, ctx);
        }
        JSXAttributeValue::ExpressionContainer(c) => {
            // <Div bg={on ? 'n300' : 'n100'} />
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
    // <Div color="blue.600" />
    if is_known_style_prop(name) {
        let mut expr_ctx = ctx.expression_walk(name, origin, false);
        crate::extract::expressions::literal::push_string_want(&mut expr_ctx, lit, &smallvec![]);
    }
}

fn handle_attribute_container(
    name: &str,
    container: &JSXExpressionContainer<'_>,
    origin: Option<&str>,
    ctx: &mut ExtractContext<'_>,
) {
    // <Div bg={...} />
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
        // <Div css={{ color: 'red', _hover: { bg: 'n200' } }} />
        walk_style_attr(expr, origin, ctx, &smallvec![]);
        return;
    }
    if name == "r" {
        // <Div r={{ 300: { p: '1r' }, md: { mt: '2r' } }} />
        walk_r_attr(expr, origin, ctx);
        return;
    }
    if is_condition_prop(name) {
        // <Div _hover={{ color: 'red.500' }} />
        walk_style_attr(expr, origin, ctx, &smallvec![name.into()]);
        return;
    }
    if is_known_style_prop(name) {
        // <Div bg={on ? 'n300' : 'n100'} />
        let mut expr_ctx = ctx.expression_walk(name, origin, false);
        crate::extract::expressions::walk_expression(&mut expr_ctx, expr, &smallvec![]);
    }
}

fn walk_r_attr(expr: &Expression<'_>, origin: Option<&str>, ctx: &mut ExtractContext<'_>) {
    // <Div r={{ md: { mt: '2r' } }} />
    let Expression::ObjectExpression(obj) = expr else {
        return;
    };
    let mut obj_ctx = ctx.object_walk(origin, false);
    crate::extract::expressions::walk_r_object(&mut obj_ctx, obj, &smallvec![]);
}

fn walk_style_attr(
    expr: &Expression<'_>,
    origin: Option<&str>,
    ctx: &mut ExtractContext<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // <Div css={{ color: 'red' }} />
    // <Div _hover={{ bg: 'n200' }} />
    let Expression::ObjectExpression(obj) = expr else {
        return;
    };
    let mut obj_ctx = ctx.object_walk(origin, false);
    crate::extract::expressions::walk_style_object(&mut obj_ctx, obj, when);
}

fn format_jsx_element_name(name: &JSXElementName<'_>) -> String {
    match name {
        JSXElementName::Identifier(ident) => {
            // <div />
            ident.name.to_string()
        }
        JSXElementName::IdentifierReference(ident) => {
            // <Div />
            ident.name.to_string()
        }
        JSXElementName::NamespacedName(ns) => {
            // <svg:path />
            format!("{}:{}", ns.namespace.name, ns.name.name)
        }
        JSXElementName::MemberExpression(member) => {
            // <Foo.Bar />
            format_jsx_member_expr(member)
        }
        JSXElementName::ThisExpression(_) => {
            // <this />
            "this".to_string()
        }
    }
}

fn format_jsx_member_expr(member: &JSXMemberExpression<'_>) -> String {
    // <Foo.Bar /> / <Foo.Bar.Baz />
    format!(
        "{}.{}",
        format_jsx_member_object(&member.object),
        member.property.name
    )
}

fn format_jsx_member_object(object: &oxc_ast::ast::JSXMemberExpressionObject<'_>) -> String {
    match object {
        oxc_ast::ast::JSXMemberExpressionObject::IdentifierReference(ident) => {
            // <Foo.Bar />
            ident.name.to_string()
        }
        oxc_ast::ast::JSXMemberExpressionObject::MemberExpression(inner) => {
            // <Foo.Bar.Baz />
            format_jsx_member_expr(inner)
        }
        oxc_ast::ast::JSXMemberExpressionObject::ThisExpression(_) => {
            // <this.Foo />
            "this".to_string()
        }
    }
}

fn format_jsx_attribute_name(name: &JSXAttributeName<'_>) -> String {
    match name {
        JSXAttributeName::Identifier(ident) => {
            // mt=
            ident.name.to_string()
        }
        JSXAttributeName::NamespacedName(ns) => {
            // xlink:href=
            format!("{}:{}", ns.namespace.name, ns.name.name)
        }
    }
}

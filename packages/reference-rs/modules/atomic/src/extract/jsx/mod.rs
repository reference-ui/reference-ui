//! JSX StyleProps extraction on opening tags.
//!
//! Scans JSX attributes against known style props and condition keys when the
//! tag is a StyleProps host. Hosts come from styletrace names plus file-local
//! `@reference-ui/react` / `@reference-ui/styled` component imports. The `r`
//! prop object is walked through `resolve/r`, not as a scalar value.

use oxc_ast::ast::{
    Expression, JSXAttribute, JSXAttributeItem, JSXAttributeName, JSXAttributeValue,
    JSXElementName, JSXExpressionContainer, JSXMemberExpression, JSXOpeningElement, StringLiteral,
};
use smallvec::{smallvec, SmallVec};

use crate::atom::Want;
use crate::diagnostics::line_col;
use crate::extract::ExtractContext;
use canon::{is_condition_prop, is_known_style_prop};

/// Extract style-bearing attributes from a JSX opening element.
pub fn extract(opening: &JSXOpeningElement<'_>, ctx: &mut ExtractContext<'_>) {
    // <Div mt="2r" css={{ color: 'red' }} r={{ md: { p: '1r' } }} />
    let tag_name = format_jsx_element_name(&opening.name);
    if !ctx.allows_jsx_tag(&tag_name) {
        report_dropped_tag(opening, &tag_name, ctx);
        return;
    }
    let origin = Some(tag_name.as_str());

    for item in &opening.attributes {
        match item {
            JSXAttributeItem::Attribute(attr) => {
                // <Div mt="2r" />
                handle_jsx_attribute(attr, origin, ctx);
            }
            JSXAttributeItem::SpreadAttribute(spread) => {
                // <Div {...{ mt: '2r' }} />  /  <Div {...base} />
                let mut obj_ctx = ctx.object_walk(origin, false);
                crate::extract::expressions::walk_spread_argument(
                    &mut obj_ctx,
                    &spread.argument,
                    &smallvec![],
                );
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
            let want =
                Want::new(name.clone(), crate::atom::AtomValue::Bool(true)).with_origin(origin);
            ctx.wants.push(want);
            ctx.authored.push(crate::runtime::AuthoredDeclaration {
                when: Vec::new(),
                prop: name,
                value: serde_json::Value::Bool(true),
                important: false,
            });
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
        let (clean, imp) =
            crate::extract::expressions::literal::split_important_flag(lit.value.as_str());
        ctx.authored.push(crate::runtime::AuthoredDeclaration {
            when: Vec::new(),
            prop: name.to_string(),
            value: serde_json::Value::String(clean.to_string()),
            important: imp,
        });
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
        for (val, imp) in crate::extract::expressions::ast_to_json_values(expr, ctx.constants) {
            ctx.authored.push(crate::runtime::AuthoredDeclaration {
                when: Vec::new(),
                prop: name.to_string(),
                value: val,
                important: imp,
            });
        }
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
    // <Div css={[{ color: 'blue.300' }, { backgroundColor: 'green.300' }]} />
    match expr {
        Expression::ObjectExpression(obj) => {
            let mut obj_ctx = ctx.object_walk(origin, false);
            crate::extract::expressions::walk_style_object(&mut obj_ctx, obj, when);
        }
        Expression::ArrayExpression(arr) => walk_style_attr_array(arr, origin, ctx, when),
        Expression::ConditionalExpression(cond) => {
            // <Div _hover={on ? { bg: 'n200' } : { bg: 'n300' }} />
            // Both literal arms compile; the runtime picks (D11, core parity).
            walk_style_attr(&cond.consequent, origin, ctx, when);
            walk_style_attr(&cond.alternate, origin, ctx, when);
        }
        Expression::ParenthesizedExpression(paren) => {
            walk_style_attr(&paren.expression, origin, ctx, when);
        }
        _ => {}
    }
}

fn walk_style_attr_array(
    arr: &oxc_ast::ast::ArrayExpression<'_>,
    origin: Option<&str>,
    ctx: &mut ExtractContext<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // <Div css={[{ color: 'blue.300' }, { backgroundColor: 'green.300' }]} />
    for elem in &arr.elements {
        if let Some(elem_expr) = elem.as_expression() {
            walk_style_attr(elem_expr, origin, ctx, when);
        }
    }
}

/// Report a dropped tag when no hosts are resolvable at all. Unknown tags
/// under a known graph stay silent; style-bearing tags with an empty host
/// set are a missing-graph error at the tag's position, once per file.
fn report_dropped_tag(
    opening: &JSXOpeningElement<'_>,
    tag_name: &str,
    ctx: &mut ExtractContext<'_>,
) {
    if !ctx.jsx_hosts.is_empty() || !tag_may_carry_styles(opening) {
        return;
    }
    let (line, column) = ctx
        .source
        .and_then(|source| line_col(source, opening.span.start))
        .unzip();
    ctx.report_missing_graph(tag_name, line, column);
}

/// True when the tag names a style/condition attr or spreads, which may
/// forward StyleProps. Plain tags (`<div id="x" />`) never report.
fn tag_may_carry_styles(opening: &JSXOpeningElement<'_>) -> bool {
    opening.attributes.iter().any(|item| match item {
        JSXAttributeItem::Attribute(attr) => {
            let name = format_jsx_attribute_name(&attr.name);
            is_known_style_prop(&name) || is_condition_prop(&name)
        }
        JSXAttributeItem::SpreadAttribute(_) => true,
    })
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

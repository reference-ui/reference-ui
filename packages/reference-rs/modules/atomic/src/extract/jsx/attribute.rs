//! Attribute dispatch for JSX style props: each attribute is a string, a container, or a bare name,
//! and each shape routes to the style walker or to the diagnostic that explains why it cannot fold.
//! Host-owned props and non-style names pass through silently, while a style prop whose value
//! cannot fold warns at the attribute's own span. Takes one JSX attribute with its tag site and
//! emits wants, authored declarations, and diagnostics through the extract context.

use canon::{is_condition_prop, is_known_style_prop};
use oxc_ast::ast::{
    Expression, JSXAttribute, JSXAttributeValue, JSXExpressionContainer, StringLiteral,
};
use oxc_span::GetSpan;
use smallvec::smallvec;

use crate::diagnostics::DiagnosticCode;
use crate::extract::context::WalkSite;
use crate::extract::ExtractContext;

use super::format_jsx_attribute_name;
use super::style_attr::{walk_r_attr, walk_style_attr};
use super::{StyleAttr, TagSite};

pub(super) fn handle_jsx_attribute(
    attr: &JSXAttribute<'_>,
    site: TagSite<'_>,
    ctx: &mut ExtractContext<'_>,
) {
    let name = format_jsx_attribute_name(&attr.name);
    if site.origin.is_some_and(|tag| ctx.host_owns(tag, &name)) {
        // A host's own declared prop is an attribute on that host (§14),
        // never a style — the resolver never sees it.
        return;
    }
    let Some(val) = &attr.value else {
        // <Div border />
        if is_known_style_prop(&name) {
            // Bare attrs mint located, like string attrs (ATM-DIAG-05).
            let mut expr_ctx = ctx.expression_walk(
                &name,
                WalkSite {
                    origin: site.origin,
                    important: false,
                    backing: site.backing,
                },
            );
            let span = Some(attr.name.span());
            expr_ctx.push_want(crate::atom::AtomValue::Bool(true), smallvec![], false, span);
            ctx.authored.push(crate::runtime::AuthoredDeclaration {
                when: Vec::new(),
                prop: name,
                value: serde_json::Value::Bool(true),
                important: false,
                backing: site.backing.clone(),
            });
        }
        return;
    };

    handle_attribute_value(&name, val, site, ctx);
}
pub(super) fn handle_attribute_value(
    name: &str,
    val: &JSXAttributeValue<'_>,
    site: TagSite<'_>,
    ctx: &mut ExtractContext<'_>,
) {
    match val {
        JSXAttributeValue::StringLiteral(lit) => {
            // <Div mt="2r" />
            handle_attribute_string(name, lit, site, ctx);
        }
        JSXAttributeValue::ExpressionContainer(c) => {
            // <Div bg={on ? 'n300' : 'n100'} />
            handle_attribute_container(name, c, site, ctx);
        }
        _ => {
            // <Div mt=<span /> /> — element values are never styles; DOM attrs
            // share the namespace and stay silent (SITE-07/08 stands).
            if is_style_attr_name(ctx, site.origin.unwrap_or(""), name) {
                ctx.warn_help(
                    val.span(),
                    DiagnosticCode::NonObjectJsxStyle,
                    format!("JSX '{name}' prop value is not a static style value (element)"),
                    vec![format!(
                        "pass a static style object to '{name}' (got element)"
                    )],
                );
            }
        }
    }
}
/// True for attribute names that carry styles on this host: `css`, `r`,
/// condition props, and known style props. A name the host's own
/// declaration owns short-circuits first (§14); every other name is a
/// DOM attribute.
fn is_style_attr_name(ctx: &ExtractContext<'_>, tag: &str, name: &str) -> bool {
    !ctx.host_owns(tag, name)
        && (name == "css" || name == "r" || is_condition_prop(name) || is_known_style_prop(name))
}
fn handle_attribute_string(
    name: &str,
    lit: &StringLiteral<'_>,
    site: TagSite<'_>,
    ctx: &mut ExtractContext<'_>,
) {
    // <Div color="blue.600" />
    if is_known_style_prop(name) {
        let mut expr_ctx = ctx.expression_walk(
            name,
            WalkSite {
                origin: site.origin,
                important: false,
                backing: site.backing,
            },
        );
        crate::extract::expressions::literal::push_string_want(&mut expr_ctx, lit, &smallvec![]);
        let (clean, imp) =
            crate::extract::expressions::literal::split_important_flag(lit.value.as_str());
        ctx.authored.push(crate::runtime::AuthoredDeclaration {
            when: Vec::new(),
            prop: name.to_string(),
            value: serde_json::Value::String(clean.to_string()),
            important: imp,
            backing: site.backing.clone(),
        });
    }
}
fn handle_attribute_container(
    name: &str,
    container: &JSXExpressionContainer<'_>,
    site: TagSite<'_>,
    ctx: &mut ExtractContext<'_>,
) {
    // <Div bg={...} />
    if let Some(expr) = container.expression.as_expression() {
        dispatch_attribute_expression(name, expr, site, ctx);
    }
}
fn dispatch_attribute_expression(
    name: &str,
    expr: &Expression<'_>,
    site: TagSite<'_>,
    ctx: &mut ExtractContext<'_>,
) {
    let attr = StyleAttr {
        prop: name,
        origin: site.origin,
        backing: site.backing,
    };
    if name == "css" {
        // <Div css={{ color: 'red', _hover: { bg: 'n200' } }} />
        walk_style_attr(expr, &attr, ctx, &smallvec![]);
        return;
    }
    if name == "r" {
        // <Div r={{ 300: { p: '1r' }, md: { mt: '2r' } }} />
        walk_r_attr(expr, &attr, ctx);
        return;
    }
    if is_condition_prop(name) {
        // <Div _hover={{ color: 'red.500' }} />
        walk_style_attr(expr, &attr, ctx, &smallvec![name.into()]);
        return;
    }
    if is_known_style_prop(name) {
        // <Div bg={on ? 'n300' : 'n100'} />
        let mut expr_ctx = ctx.expression_walk(
            name,
            WalkSite {
                origin: site.origin,
                important: false,
                backing: site.backing,
            },
        );
        crate::extract::expressions::walk_expression(&mut expr_ctx, expr, &smallvec![]);
        for (val, imp) in crate::extract::expressions::ast_to_json_values(expr, ctx.scoped()) {
            ctx.authored.push(crate::runtime::AuthoredDeclaration {
                when: Vec::new(),
                prop: name.to_string(),
                value: val,
                important: imp,
                backing: site.backing.clone(),
            });
        }
    }
}

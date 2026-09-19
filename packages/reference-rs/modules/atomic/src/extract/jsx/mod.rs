//! JSX StyleProps extraction on opening tags.
//!
//! Scans JSX attributes against known style props and condition keys when the
//! tag is a StyleProps host. Hosts come from styletrace names plus file-local
//! `@reference-ui/react` / `@reference-ui/styled` component imports. The `r`
//! prop object is walked through `resolve/r`, not as a scalar value.

use oxc_ast::ast::{
    ArrayExpressionElement, Expression, JSXAttribute, JSXAttributeItem, JSXAttributeValue,
    JSXExpressionContainer, JSXOpeningElement, StringLiteral,
};
use oxc_span::{GetSpan, Span};
use smallvec::{smallvec, SmallVec};

use crate::atom::Want;
use crate::diagnostics::{line_col, DiagnosticCode};
use crate::extract::constants::ConstArrayElement;
use crate::extract::expressions::walk::{
    block_value_kind, is_silent_block_value, unwrap_wrapper_target,
};
use crate::extract::expressions::{
    lower_array_object, lower_const_object, resolve_block_target, BagSemantics, BlockLookup,
};
use crate::extract::fold::{merge_spread, spread_base_name, MergeSpread};
use crate::extract::ExtractContext;
use canon::{is_condition_prop, is_known_style_prop};

use names::{format_jsx_attribute_name, format_jsx_element_name};

mod names;

/// A JSX style-block prop site (`css`, `r`, or a condition prop) under walk.
struct StyleAttr<'a> {
    prop: &'a str,
    origin: Option<&'a str>,
}

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
                // A spread bag names attributes, not style positions (§12).
                let mut obj_ctx = ctx.object_walk(origin, false);
                obj_ctx.bag = BagSemantics::JsxAttributes;
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
    if origin.is_some_and(|tag| ctx.host_owns(tag, &name)) {
        // A host's own declared prop is an attribute on that host (§14),
        // never a style — the resolver never sees it.
        return;
    }
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
        _ => {
            // <Div mt=<span /> /> — element values are never styles; DOM attrs
            // share the namespace and stay silent (SITE-07/08 stands).
            if is_style_attr_name(ctx, origin.unwrap_or(""), name) {
                ctx.warn(
                    val.span(),
                    DiagnosticCode::NonObjectJsxStyle,
                    format!("JSX '{name}' prop value is not a static style value (element)"),
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
        let site = StyleAttr { prop: name, origin };
        walk_style_attr(expr, &site, ctx, &smallvec![]);
        return;
    }
    if name == "r" {
        // <Div r={{ 300: { p: '1r' }, md: { mt: '2r' } }} />
        let site = StyleAttr { prop: name, origin };
        walk_r_attr(expr, &site, ctx);
        return;
    }
    if is_condition_prop(name) {
        // <Div _hover={{ color: 'red.500' }} />
        let site = StyleAttr { prop: name, origin };
        walk_style_attr(expr, &site, ctx, &smallvec![name.into()]);
        return;
    }
    if is_known_style_prop(name) {
        // <Div bg={on ? 'n300' : 'n100'} />
        let mut expr_ctx = ctx.expression_walk(name, origin, false);
        crate::extract::expressions::walk_expression(&mut expr_ctx, expr, &smallvec![]);
        for (val, imp) in crate::extract::expressions::ast_to_json_values(expr, ctx.scoped()) {
            ctx.authored.push(crate::runtime::AuthoredDeclaration {
                when: Vec::new(),
                prop: name.to_string(),
                value: val,
                important: imp,
            });
        }
    }
}

fn walk_r_attr(expr: &Expression<'_>, site: &StyleAttr<'_>, ctx: &mut ExtractContext<'_>) {
    // <Div r={{ md: { mt: '2r' } }} />
    if let Some(inner) = unwrap_wrapper_target(expr) {
        // <Div r={{...} as const} /> — wrappers erase to the bare block.
        walk_r_attr(inner, site, ctx);
        return;
    }
    match expr {
        Expression::ObjectExpression(obj) => {
            let mut obj_ctx = ctx.object_walk(site.origin, false);
            crate::extract::expressions::walk_r_object(&mut obj_ctx, obj, &smallvec![]);
        }
        Expression::ConditionalExpression(cond) => {
            // <Div r={on ? { md: {...} } : { md: {...} }} /> — both arms walk.
            walk_r_attr(&cond.consequent, site, ctx);
            walk_r_attr(&cond.alternate, site, ctx);
        }
        _ => {
            refuse_unless_silent_jsx(expr, site, ctx);
        }
    }
}

fn walk_style_attr(
    expr: &Expression<'_>,
    site: &StyleAttr<'_>,
    ctx: &mut ExtractContext<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // <Div css={{ color: 'red' }} />
    // <Div _hover={{ bg: 'n200' }} />
    // <Div css={[{ color: 'blue.300' }, { backgroundColor: 'green.300' }]} />
    if let Some(inner) = unwrap_wrapper_target(expr) {
        // <Div css={{...} as const} /> — wrappers erase to the bare block.
        walk_style_attr(inner, site, ctx, when);
        return;
    }
    match expr {
        Expression::ObjectExpression(obj) => {
            let mut obj_ctx = ctx.object_walk(site.origin, false);
            crate::extract::expressions::walk_style_object(&mut obj_ctx, obj, when);
        }
        Expression::ArrayExpression(arr) => walk_style_attr_array(arr, site, ctx, when),
        Expression::ConditionalExpression(cond) => {
            // <Div _hover={on ? { bg: 'n200' } : { bg: 'n300' }} />
            // Both literal arms compile; the runtime picks (D11, core parity).
            walk_style_attr(&cond.consequent, site, ctx, when);
            walk_style_attr(&cond.alternate, site, ctx, when);
        }
        _ => {
            handle_folding_attr(expr, site, ctx, when);
        }
    }
}

/// Lower a folding style-block shape — logical operands, identifiers,
/// members — or refuse it at the prop. Anything else is not a style block.
fn handle_folding_attr(
    expr: &Expression<'_>,
    site: &StyleAttr<'_>,
    ctx: &mut ExtractContext<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    match expr {
        Expression::LogicalExpression(log) => {
            // <Div css={ok && {...}} /> — both operands lower, like spreads.
            walk_style_attr(&log.left, site, ctx, when);
            walk_style_attr(&log.right, site, ctx, when);
        }
        Expression::Identifier(_) | Expression::StaticMemberExpression(_) => {
            // <Div css={styles} /> — resolve, lower, or diagnose.
            lower_block_attr(expr, site, ctx, when);
        }
        _ => {
            refuse_unless_silent_jsx(expr, site, ctx);
        }
    }
}

/// Lower an identifier or member style block through its const object,
/// exactly as if spread. A miss names the write when the base is mutated,
/// else refuses at the prop; sibling attributes always survive.
fn lower_block_attr(
    expr: &Expression<'_>,
    site: &StyleAttr<'_>,
    ctx: &mut ExtractContext<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    match resolve_block_target(ctx.scoped(), expr) {
        BlockLookup::Hit(name, obj) => {
            let mut obj_ctx = ctx.object_walk(site.origin, false);
            lower_const_object(&mut obj_ctx, &name, obj, when, expr.span());
        }
        BlockLookup::Miss(base) => {
            if !mutated_attr_warn(ctx, &base, expr.span(), site) {
                refuse_unless_silent_jsx(expr, site, ctx);
            }
        }
        BlockLookup::NotBlock => {
            refuse_unless_silent_jsx(expr, site, ctx);
        }
    }
}

/// Warn naming the write when a style block's base name is mutated.
fn mutated_attr_warn(
    ctx: &mut ExtractContext<'_>,
    base: &str,
    span: Span,
    site: &StyleAttr<'_>,
) -> bool {
    let Some(write) = ctx.scoped().mutation(base) else {
        return false;
    };
    ctx.warn(
        span,
        DiagnosticCode::MutatedBinding,
        format!(
            "Dynamic mutated binding '{base}' in JSX '{}' prop value ({}; keeping sibling attributes)",
            site.prop,
            write.write_phrase()
        ),
    );
    true
}

/// Diagnose a block value that extracts nothing, unless it skips silently.
fn refuse_unless_silent_jsx(
    expr: &Expression<'_>,
    site: &StyleAttr<'_>,
    ctx: &mut ExtractContext<'_>,
) {
    if !is_silent_block_value(expr) {
        refuse_style_attr(expr, site, ctx);
    }
}

/// Diagnose a JSX style-block value that is not a static style object.
fn refuse_style_attr(expr: &Expression<'_>, site: &StyleAttr<'_>, ctx: &mut ExtractContext<'_>) {
    // <Div css={styles} />  /  <Div _hover={on && {...}} />
    ctx.warn(
        expr.span(),
        DiagnosticCode::NonObjectJsxStyle,
        format!(
            "JSX '{}' prop value is not a static style object ({})",
            site.prop,
            block_value_kind(expr)
        ),
    );
}

fn walk_style_attr_array(
    arr: &oxc_ast::ast::ArrayExpression<'_>,
    site: &StyleAttr<'_>,
    ctx: &mut ExtractContext<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // <Div css={[{ color: 'blue.300' }, { backgroundColor: 'green.300' }]} />
    for elem in &arr.elements {
        walk_style_attr_element(elem, site, ctx, when);
    }
}

/// Walk one merge-list element of a JSX style-block array: literal and
/// const-array spreads flatten in place, dynamic spreads refuse.
fn walk_style_attr_element(
    elem: &ArrayExpressionElement<'_>,
    site: &StyleAttr<'_>,
    ctx: &mut ExtractContext<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    match elem {
        ArrayExpressionElement::SpreadElement(spread) => {
            walk_attr_spread(spread, site, ctx, when);
        }
        ArrayExpressionElement::Elision(_) => {
            // Holes skip silently.
        }
        _ => {
            if let Some(elem_expr) = elem.as_expression() {
                walk_style_attr(elem_expr, site, ctx, when);
            }
        }
    }
}

/// Walk one JSX merge-list spread: flatten, name the write, or refuse.
fn walk_attr_spread(
    spread: &oxc_ast::ast::SpreadElement<'_>,
    site: &StyleAttr<'_>,
    ctx: &mut ExtractContext<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // <Div css={[{...}, ...[{...}], ...extras]} /> — siblings merge whether
    // this spread flattens or refuses.
    if flatten_attr_spread(&spread.argument, site, ctx, when) {
        return;
    }
    if let Some(name) = spread_base_name(&spread.argument) {
        if mutated_attr_warn(ctx, name, spread.span, site) {
            return;
        }
    }
    ctx.warn(
        spread.span,
        DiagnosticCode::NonObjectJsxStyle,
        format!(
            "JSX '{}' prop value is not a static style object (spread element)",
            site.prop
        ),
    );
}

/// Flatten one JSX merge-list spread: inline elements lower one by one,
/// const elements lower from the recording. False refuses.
fn flatten_attr_spread(
    arg: &Expression<'_>,
    site: &StyleAttr<'_>,
    ctx: &mut ExtractContext<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) -> bool {
    match merge_spread(arg, ctx.scoped()) {
        Some(MergeSpread::Inline(elements)) => {
            for elem in elements {
                walk_style_attr_element(elem, site, ctx, when);
            }
            true
        }
        Some(MergeSpread::Const(elements)) => {
            lower_attr_const(elements, arg, site, ctx, when);
            true
        }
        None => false,
    }
}

/// Lower a const JSX merge-list spread: objects merge, leaves and holes skip.
fn lower_attr_const(
    elements: &[ConstArrayElement],
    arg: &Expression<'_>,
    site: &StyleAttr<'_>,
    ctx: &mut ExtractContext<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // Literal leaves skip silently, like string-head args.
    let name = spread_base_name(arg).unwrap_or("array");
    for element in elements {
        if let ConstArrayElement::Object(map) = element {
            let mut obj_ctx = ctx.object_walk(site.origin, false);
            lower_array_object(&mut obj_ctx, name, map, when, arg.span());
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
    if !ctx.jsx_hosts.is_empty() || !tag_may_carry_styles(opening, ctx, tag_name) {
        return;
    }
    let (line, column) = ctx
        .source
        .and_then(|source| line_col(source, opening.span.start))
        .unzip();
    ctx.report_missing_graph(tag_name, line, column);
}

/// True when the tag names a style/condition attr or spreads, which may
/// forward StyleProps. Plain tags (`<div id="x" />`) never report, and
/// neither do attrs the host's own declaration owns (§14).
fn tag_may_carry_styles(
    opening: &JSXOpeningElement<'_>,
    ctx: &ExtractContext<'_>,
    tag: &str,
) -> bool {
    opening.attributes.iter().any(|item| match item {
        JSXAttributeItem::Attribute(attr) => {
            let name = format_jsx_attribute_name(&attr.name);
            !ctx.host_owns(tag, &name) && (is_known_style_prop(&name) || is_condition_prop(&name))
        }
        JSXAttributeItem::SpreadAttribute(_) => true,
    })
}

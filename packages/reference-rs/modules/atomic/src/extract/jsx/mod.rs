//! JSX StyleProps extraction on opening tags.
//!
//! Scans JSX attributes against known style props and condition keys when the
//! tag is a StyleProps host. Hosts come from styletrace names plus file-local
//! `@reference-ui/react` / `@reference-ui/styled` component imports. The `r`
//! prop object is walked through `resolve/r`, not as a scalar value. A styled
//! tag imported from an installed package lowers as external and reports
//! `ATM-W-EXTERNAL-UNBACKED`, which assembly keeps only when nothing backs it.

use attribute::{handle_attribute_value, handle_jsx_attribute};
use canon::{is_condition_prop, is_known_style_prop};
use oxc_ast::ast::{JSXAttributeItem, JSXOpeningElement};
use smallvec::smallvec;

use crate::diagnostics::line_col;
use crate::extract::expressions::BagSemantics;
use crate::extract::ExtractContext;
use crate::resolve::font::scope;

pub(crate) use names::{format_jsx_attribute_name, format_jsx_element_name, is_external_tag};

mod attribute;
mod names;
mod style_attr;

#[cfg(test)]
mod bare_attr_tests;

#[cfg(test)]
mod external_tag_tests;

#[cfg(test)]
mod unbacked_tests;

/// A JSX style-block prop site (`css`, `r`, or a condition prop) under walk.
struct StyleAttr<'a> {
    prop: &'a str,
    origin: Option<&'a str>,
    external: bool,
}

/// The tag a style attribute is written on: its origin spelling plus whether
/// it is an **external** component (a capitalized non-host tag) whose wants
/// the consumer resolves and backs. Host tags stay `external: false`.
#[derive(Clone, Copy)]
struct TagSite<'a> {
    origin: Option<&'a str>,
    external: bool,
}

/// Extract style-bearing attributes from a JSX opening element.
pub fn extract(opening: &JSXOpeningElement<'_>, ctx: &mut ExtractContext<'_>) {
    // <Div mt="2r" css={{ color: 'red' }} r={{ md: { p: '1r' } }} />
    // One element, one family scope: bare weights resolve against this
    // element's font once every attribute and spread has lowered. Authored
    // plans stay bare: plan keys carry no family, so they keep serving
    // dynamic lookups under keyword semantics exactly as today.
    let wants_at = ctx.wants.len();
    let tag_name = format_jsx_element_name(&opening.name);
    if let Some(external) = tag_gate(opening, &tag_name, ctx) {
        let site = TagSite {
            origin: Some(tag_name.as_str()),
            external,
        };
        lower_attributes(opening, site, ctx);
        if external && ctx.wants.len() > wants_at {
            // Once per tag, and only when a style prop lowered (owned props
            // and plain tags never do).
            report_unbacked(opening, &tag_name, ctx);
        }
    }
    scope::apply_to_wants(&mut ctx.wants[wants_at..]);
}

/// Report `ATM-W-EXTERNAL-UNBACKED` when another package's runtime styles
/// this external tag: its root is package-bound (`<BoltIcon color="red" />`
/// from a package), or it is a same-file wrapper whose `css` prop, set
/// here, forwards into a package-bound tag (`<Wrap css={{ … }} />`).
fn report_unbacked(opening: &JSXOpeningElement<'_>, tag: &str, ctx: &mut ExtractContext<'_>) {
    let forwarded = || ctx.css_forward_package(tag).filter(|_| sets_css(opening));
    let Some(specifier) = ctx.bound_package(tag).or_else(forwarded) else {
        return;
    };
    ctx.report_unbacked_external(opening.span, tag, specifier);
}

/// True when the tag carries a direct `css` attribute.
fn sets_css(opening: &JSXOpeningElement<'_>) -> bool {
    opening.attributes.iter().any(|item| match item {
        JSXAttributeItem::Attribute(attr) => format_jsx_attribute_name(&attr.name) == "css",
        JSXAttributeItem::SpreadAttribute(_) => false,
    })
}

/// Lower every attribute and spread on an admitted tag through `site`.
fn lower_attributes(
    opening: &JSXOpeningElement<'_>,
    site: TagSite<'_>,
    ctx: &mut ExtractContext<'_>,
) {
    for item in &opening.attributes {
        match item {
            JSXAttributeItem::Attribute(attr) => {
                // <Div mt="2r" />  /  <BoltIcon color="red" />
                handle_jsx_attribute(attr, site, ctx);
            }
            JSXAttributeItem::SpreadAttribute(spread) => {
                // <Div {...{ mt: '2r' }} />  /  <Div {...base} />
                // A spread bag names attributes, not style positions (§12).
                let mut obj_ctx = ctx.object_walk(site.origin, false, site.external);
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

/// Resolve the tag gate: `Some(external)` when the attributes should lower,
/// `None` when the tag is a threaded wrapper (already lowered) or dropped.
///
/// Order is pinned (G0 §D): a threaded wrapper lowers its `css` first,
/// unchanged; then a capitalized non-host tag is an external component — but
/// only once the host graph resolved, so an empty graph still reports the
/// missing graph; every other tag takes today's drop path.
fn tag_gate(
    opening: &JSXOpeningElement<'_>,
    tag_name: &str,
    ctx: &mut ExtractContext<'_>,
) -> Option<bool> {
    if ctx.allows_jsx_tag(tag_name) {
        return Some(false);
    }
    if extract_threaded_wrapper(opening, tag_name, ctx) {
        return None;
    }
    if !ctx.jsx_hosts.is_empty() && is_external_tag(tag_name) {
        return Some(true);
    }
    report_dropped_tag(opening, tag_name, ctx);
    None
}

/// Lower a threaded wrapper's direct `css` value as if written on the
/// host. True when the tag threads (handled, even with no `css` attr);
/// only the threaded prop walks — every sibling is the wrapper's own.
fn extract_threaded_wrapper(
    opening: &JSXOpeningElement<'_>,
    tag_name: &str,
    ctx: &mut ExtractContext<'_>,
) -> bool {
    // <Rows members={list} css={shared} /> — only css={...} lowers.
    if !ctx.threads_css(tag_name) {
        return false;
    }
    let origin = Some(tag_name);
    for item in &opening.attributes {
        lower_threaded_item(item, origin, ctx);
    }
    true
}

/// Lower one wrapper attribute: a direct `css={...}` walks as a style
/// block; every other attribute and spread is the wrapper's own.
fn lower_threaded_item(
    item: &JSXAttributeItem<'_>,
    origin: Option<&str>,
    ctx: &mut ExtractContext<'_>,
) {
    let JSXAttributeItem::Attribute(attr) = item else {
        // Spread bags on a wrapper are the wrapper's own props,
        // never style positions — only direct css={...} threads.
        return;
    };
    if format_jsx_attribute_name(&attr.name) != "css" {
        return;
    }
    if let Some(val) = &attr.value {
        // A threaded wrapper's `css` is the wrapper's own lowering, never
        // external (G0 §D: the wrapper path is unchanged).
        let site = TagSite {
            origin,
            external: false,
        };
        handle_attribute_value("css", val, site, ctx);
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

#[cfg(test)]
mod tests;

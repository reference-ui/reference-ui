//! JSX StyleProps extraction on opening tags.
//!
//! Scans JSX attributes against known style props and condition keys when the
//! tag is a StyleProps host. Hosts come from styletrace names plus file-local
//! `@reference-ui/react` / `@reference-ui/styled` component imports. The `r`
//! prop object is walked through `resolve/r`, not as a scalar value. A styled
//! tag no host admits lowers under the systems that render it ([`Composed`]):
//! a package's published systems this compile composes, or, when none is,
//! nothing at all, with `ATM-W-EXTERNAL-UNBACKED` at the tag naming the package
//! and its `baseSystem`. A tag from a package not built on Reference UI is not
//! a Reference component and lowers nothing, silently.

use attribute::{handle_attribute_value, handle_jsx_attribute};
use canon::{is_condition_prop, is_known_style_prop};
use oxc_ast::ast::{JSXAttributeItem, JSXOpeningElement};
use smallvec::smallvec;

use crate::atom::{backing::OWN, Backing};
use crate::diagnostics::line_col;
use crate::extract::backing::Unbacked;
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
    backing: &'a Backing,
}

/// The tag a style attribute is written on: its origin spelling plus the
/// systems its wants lower under (own for a host).
#[derive(Clone, Copy)]
struct TagSite<'a> {
    origin: Option<&'a str>,
    backing: &'a Backing,
}

/// An admitted tag's verdict: what its attributes lower under, and the
/// warning it owes once a style prop lowered.
struct Gate<'a> {
    backing: Backing,
    unbacked: Option<Unbacked<'a>>,
}

impl Gate<'_> {
    /// An own host or a backed non-host: nothing to warn.
    fn backed(backing: Backing) -> Self {
        Self {
            backing,
            unbacked: None,
        }
    }
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
    if let Some(gate) = tag_gate(opening, &tag_name, ctx) {
        let site = TagSite {
            origin: Some(tag_name.as_str()),
            backing: &gate.backing,
        };
        lower_attributes(opening, site, ctx);
        if let Some(unbacked) = &gate.unbacked {
            if ctx.wants.len() > wants_at {
                // Once per tag, and only when a style prop lowered (owned
                // props and plain tags never do).
                ctx.report_unbacked_external(opening.span, &tag_name, unbacked);
            }
        }
    }
    scope::apply_to_wants(&mut ctx.wants[wants_at..]);
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
                let mut obj_ctx = ctx.object_walk(site.origin, false, site.backing);
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

/// Resolve the tag gate: `Some(gate)` when the attributes should lower,
/// `None` when the tag is a threaded wrapper (already lowered) or dropped.
///
/// Order is pinned (G0 §D): a threaded wrapper lowers its `css` first,
/// unchanged; then a capitalized non-host tag lowers under the systems that
/// render it — but only once the host graph resolved, so an empty graph still
/// reports the missing graph; every other tag takes today's drop path.
fn tag_gate<'a>(
    opening: &JSXOpeningElement<'_>,
    tag_name: &str,
    ctx: &mut ExtractContext<'a>,
) -> Option<Gate<'a>> {
    if ctx.allows_jsx_tag(tag_name) {
        return Some(Gate::backed(Backing::Own));
    }
    if extract_threaded_wrapper(opening, tag_name, ctx) {
        return None;
    }
    if !ctx.jsx_hosts.is_empty() && is_external_tag(tag_name) {
        return non_host_gate(opening, tag_name, ctx);
    }
    report_dropped_tag(opening, tag_name, ctx);
    None
}

/// The gate of a styled non-host tag: its root's package (through same-file
/// aliases), else the package a same-file wrapper forwards its `css` into,
/// else its provenance. A package nothing composed backs lowers under no
/// system and warns: at a package-bound tag always, at a forwarding wrapper
/// only where the call site sets `css`. A foreign package lowers nothing.
fn non_host_gate<'a>(
    opening: &JSXOpeningElement<'_>,
    tag: &str,
    ctx: &ExtractContext<'a>,
) -> Option<Gate<'a>> {
    let (package, warns) = match ctx.bound_package(tag) {
        Some(package) => (Some(package), true),
        None => (ctx.css_forward_package(tag), sets_css(opening)),
    };
    let verdict = ctx.composed.non_host(package, ctx.tag_provenance(tag), tag);
    let backing = verdict.lowering()?;
    let unbacked = verdict.unbacked().filter(|_| warns);
    Some(Gate { backing, unbacked })
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
        // A threaded wrapper's `css` is the wrapper's own lowering, always
        // own (G0 §D: the wrapper path is unchanged).
        let site = TagSite {
            origin,
            backing: &OWN,
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

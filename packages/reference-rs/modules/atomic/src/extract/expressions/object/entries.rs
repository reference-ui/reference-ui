//! One recorded entry of a const object: style leaves, responsive nests, conditions.
//! A style entry pushes one want and one authored plan per recorded leaf, or
//! lowers its responsive sub-entries under their sub-key conditions; a
//! condition entry scopes its nested map under its key. Entries with no
//! static value diagnose like inline refusals, and kept leaves beside a
//! dropped dynamic arm name the loss through the residue channel.

use super::{lower::LowerSite, lower_const_object, ObjectWalk};
use crate::atom::AtomValue;
use crate::diagnostics::DiagnosticCode;
use crate::extract::constants::{ConstObject, ObjectProp};

/// Lower one style entry: its leaves, or its responsive sub-entries by key.
pub(crate) fn lower_style_entry(
    ctx: &mut ObjectWalk<'_>,
    site: &LowerSite<'_>,
    key: &str,
    prop: &ObjectProp,
) {
    if !prop.nested.is_empty() {
        // { padding: { base: '1r', md: '2r' } }  — sub-keys ride `when`,
        // exactly like an inline responsive object
        lower_responsive_entries(ctx, site, key, &prop.nested);
    }
    if prop.leaves.is_empty() {
        if prop.nested.is_empty() {
            // { color: pick() } — recorded but unlowerable; name it (55/65)
            ctx.warn(
                site.span,
                DiagnosticCode::UnfoldableObjectProp,
                format!(
                    "property '{key}' of '{}' has no static style value",
                    site.name
                ),
            );
        } else if prop.residue {
            // { ...(c ? { color: { base: 'red' } } : { color: pick() }) } —
            // the nested entries lowered above; name the dropped value arm
            ctx.warn(
                site.span,
                DiagnosticCode::PartialObjectProp,
                format!(
                    "property '{key}' of '{}' drops a dynamic arm with no static style value",
                    site.name
                ),
            );
        }
        return;
    }
    push_entry_leaves(ctx, key, &prop.leaves, site);
    if prop.residue {
        // { color: flag ? 'white' : run() } — the kept leaves lowered; name
        // the dropped arm (Ph4 residue channel)
        ctx.warn(
            site.span,
            DiagnosticCode::PartialObjectProp,
            format!(
                "property '{key}' of '{}' drops a dynamic arm with no static style value",
                site.name
            ),
        );
    }
}

/// Push one want and one authored plan per recorded leaf at one site.
fn push_entry_leaves(
    ctx: &mut ObjectWalk<'_>,
    key: &str,
    leaves: &[AtomValue],
    site: &LowerSite<'_>,
) {
    let when_strings: Vec<String> = site.when.iter().map(|w| w.to_string()).collect();
    let important = ctx.important;
    for val in leaves {
        let mut expr_ctx = ctx.expression_walk(key);
        expr_ctx.push_want(val.clone(), site.when.clone(), false, Some(site.span));
        if let Some(authored) = ctx.authored.as_mut() {
            if let Some(json) = super::super::ast_value::atom_value_to_json(val) {
                authored.push(crate::runtime::AuthoredDeclaration {
                    when: when_strings.clone(),
                    prop: key.to_string(),
                    value: json,
                    important,
                });
            }
        }
    }
}

/// Lower responsive sub-entries under their sub-key conditions.
fn lower_responsive_entries(
    ctx: &mut ObjectWalk<'_>,
    site: &LowerSite<'_>,
    key: &str,
    nested: &ConstObject,
) {
    for (sub, subprop) in nested.iter() {
        if !subprop.nested.is_empty() || subprop.leaves.is_empty() {
            // Doubly nested or unlowerable responsive values stay out, named
            ctx.warn(
                site.span,
                DiagnosticCode::UnfoldableObjectProp,
                format!(
                    "property '{key}.{sub}' of '{}' has no static style value",
                    site.name
                ),
            );
            continue;
        }
        let mut sub_when = site.when.clone();
        sub_when.push(sub.clone().into());
        let sub_site = LowerSite {
            name: site.name,
            when: &sub_when,
            span: site.span,
        };
        push_entry_leaves(ctx, key, &subprop.leaves, &sub_site);
        if subprop.residue {
            ctx.warn(
                site.span,
                DiagnosticCode::PartialObjectProp,
                format!(
                    "property '{key}.{sub}' of '{}' drops a dynamic arm with no static style value",
                    site.name
                ),
            );
        }
    }
}

/// Lower one condition entry: nested objects scope under the key, scalar
/// values refuse like inline conditions, empty markers diagnose.
pub(crate) fn lower_condition_entry(
    ctx: &mut ObjectWalk<'_>,
    site: &LowerSite<'_>,
    key: &str,
    prop: &ObjectProp,
) {
    if !prop.nested.is_empty() {
        // { _hover: { color: 'red' } }  — the nested entries lower scoped,
        // preserving the conditional data through the spread (SPEC-V2-24)
        let mut nested_when = site.when.clone();
        nested_when.push(key.into());
        lower_const_object(ctx, site.name, &prop.nested, &nested_when, site.span);
    }
    if prop.leaves.is_empty() {
        if prop.nested.is_empty() {
            // { _hover: pick() }  — recorded but unlowerable; name it
            ctx.warn(
                site.span,
                DiagnosticCode::UnfoldableObjectProp,
                format!(
                    "property '{key}' of '{}' has no static style value",
                    site.name
                ),
            );
        } else if prop.residue {
            // The nested entries lowered above; name the dropped value arm
            // a union merged beside them
            ctx.warn(
                site.span,
                DiagnosticCode::PartialObjectProp,
                format!(
                    "property '{key}' of '{}' drops a dynamic arm with no static style value",
                    site.name
                ),
            );
        }
        return;
    }
    // { _hover: 'red' }  — a condition block must be an object, as inline
    ctx.warn(
        site.span,
        DiagnosticCode::NonObjectCondition,
        "Condition block expected object expression",
    );
}

/// Lower one recorded `css` entry as the css prop value: its nested object
/// lowers as a style object, scalar leaves stay silent like scalar css
/// attributes, and an empty marker diagnoses like any unlowerable entry.
/// Only reached under `JsxAttributes`; style objects warn on `css` instead.
pub(crate) fn lower_css_entry(
    ctx: &mut ObjectWalk<'_>,
    site: &LowerSite<'_>,
    key: &str,
    prop: &ObjectProp,
) {
    if !prop.nested.is_empty() {
        // { css: { paddingInline: '0.5rem' } }  — the css prop's style object
        lower_const_object(ctx, site.name, &prop.nested, site.when, site.span);
    }
    if prop.leaves.is_empty() && prop.nested.is_empty() {
        // { css: pick() }  — recorded but unlowerable; name it
        ctx.warn(
            site.span,
            DiagnosticCode::UnfoldableObjectProp,
            format!(
                "property '{key}' of '{}' has no static style value",
                site.name
            ),
        );
    } else if prop.residue {
        // The kept side lowered (or stayed silent); name the dropped arm
        ctx.warn(
            site.span,
            DiagnosticCode::PartialObjectProp,
            format!(
                "property '{key}' of '{}' drops a dynamic arm with no static style value",
                site.name
            ),
        );
    }
}

/// Lower one recorded `r` entry as the r prop value: each sub-key scopes
/// its nested object under its container query. Unknown sub-keys refuse
/// like inline `r` keys, scalar subs refuse like inline scalar conditions,
/// and direct scalar leaves stay silent like scalar r attributes. Only
/// reached under `JsxAttributes`; style objects warn on `r` instead.
pub(crate) fn lower_r_entry(
    ctx: &mut ObjectWalk<'_>,
    site: &LowerSite<'_>,
    key: &str,
    prop: &ObjectProp,
) {
    for (sub, subprop) in prop.nested.iter() {
        let trimmed = sub.trim();
        let Some(query) = super::keys::resolve_r_key(trimmed, ctx.breakpoints) else {
            // r: { wat: {...} }  — unknown, like the inline key
            ctx.warn(
                site.span,
                DiagnosticCode::UnknownBreakpoint,
                format!("Unknown breakpoint name in r prop: \"{trimmed}\""),
            );
            continue;
        };
        let sub_site = RSub {
            key,
            sub,
            subprop,
            query: &query,
        };
        lower_r_sub(ctx, site, &sub_site);
    }
    if prop.leaves.is_empty() && prop.nested.is_empty() {
        // { r: pick() }  — recorded but unlowerable; name it
        ctx.warn(
            site.span,
            DiagnosticCode::UnfoldableObjectProp,
            format!(
                "property '{key}' of '{}' has no static style value",
                site.name
            ),
        );
    }
}

/// One recorded `r` sub-key under walk: its names, entry, and lowered query.
struct RSub<'a> {
    key: &'a str,
    sub: &'a str,
    subprop: &'a ObjectProp,
    query: &'a str,
}

/// Lower one recorded `r` sub-key under its container query: nested objects
/// scope, scalar values refuse like inline conditions, empty markers
/// diagnose, and kept nests beside a dropped arm name the loss.
fn lower_r_sub(ctx: &mut ObjectWalk<'_>, site: &LowerSite<'_>, sub: &RSub<'_>) {
    if !sub.subprop.nested.is_empty() {
        // r: { md: { mt: '2r' } }  — scoped under the container query
        let mut sub_when = site.when.clone();
        sub_when.push(sub.query.into());
        lower_const_object(ctx, site.name, &sub.subprop.nested, &sub_when, site.span);
    }
    if sub.subprop.leaves.is_empty() {
        if sub.subprop.nested.is_empty() {
            // r: { md: pick() }  — recorded but unlowerable; name it
            ctx.warn(
                site.span,
                DiagnosticCode::UnfoldableObjectProp,
                format!(
                    "property '{}.{}' of '{}' has no static style value",
                    sub.key, sub.sub, site.name
                ),
            );
        } else if sub.subprop.residue {
            // The nested entries lowered above; name the dropped value arm
            ctx.warn(
                site.span,
                DiagnosticCode::PartialObjectProp,
                format!(
                    "property '{}.{}' of '{}' drops a dynamic arm with no static style value",
                    sub.key, sub.sub, site.name
                ),
            );
        }
        return;
    }
    // r: { md: '1r' }  — a condition block must be an object, as inline
    ctx.warn(
        site.span,
        DiagnosticCode::NonObjectCondition,
        "Condition block expected object expression",
    );
}

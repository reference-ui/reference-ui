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
            ctx.warn_help(
                site.span,
                DiagnosticCode::UnfoldableObjectProp,
                format!(
                    "property '{key}' of '{}' has no static style value",
                    site.name
                ),
                vec![format!(
                    "give '{key}' of '{}' a static value or drop it from the spread",
                    site.name
                )],
            );
        } else if prop.residue {
            // { ...(c ? { color: { base: 'red' } } : { color: pick() }) } —
            // the nested entries lowered above; name the dropped value arm
            ctx.warn_help(
                site.span,
                DiagnosticCode::PartialObjectProp,
                format!(
                    "property '{key}' of '{}' drops a dynamic arm with no static style value",
                    site.name
                ),
                vec![format!(
                    "make the dynamic arm of '{key}' of '{}' static or drop it",
                    site.name
                )],
            );
        }
        return;
    }
    push_entry_leaves(ctx, key, &prop.leaves, site);
    if prop.residue {
        // { color: flag ? 'white' : run() } — the kept leaves lowered; name
        // the dropped arm (Ph4 residue channel)
        ctx.warn_help(
            site.span,
            DiagnosticCode::PartialObjectProp,
            format!(
                "property '{key}' of '{}' drops a dynamic arm with no static style value",
                site.name
            ),
            vec![format!(
                "make the dynamic arm of '{key}' of '{}' static or drop it",
                site.name
            )],
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
    for val in leaves {
        // 'transparent !important' splits exactly like an inline literal —
        // the suffix is a flag, never part of the value (Forge S5-2)
        let (leaf, is_imp) = split_entry_leaf(val);
        let leaf_important = ctx.important || is_imp;
        let json = super::super::ast_value::atom_value_to_json(&leaf);
        let mut expr_ctx = ctx.expression_walk(key);
        expr_ctx.push_want(leaf, site.when.clone(), is_imp, Some(site.span));
        if let Some(authored) = ctx.authored.as_mut() {
            if let Some(json) = json {
                authored.push(crate::runtime::AuthoredDeclaration {
                    when: when_strings.clone(),
                    prop: key.to_string(),
                    value: json,
                    important: leaf_important,
                    external: ctx.external,
                });
            }
        }
    }
}

/// One recorded leaf with its `!important` suffix split into the flag:
/// strings strip like inline literals, every other leaf pushes verbatim.
fn split_entry_leaf(val: &AtomValue) -> (AtomValue, bool) {
    if let AtomValue::String(text) = val {
        let (clean, important) = super::super::literal::split_important_flag(text);
        return (AtomValue::String(clean.into()), important);
    }
    (val.clone(), false)
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
            ctx.warn_help(
                site.span,
                DiagnosticCode::UnfoldableObjectProp,
                format!(
                    "property '{key}.{sub}' of '{}' has no static style value",
                    site.name
                ),
                vec![format!(
                    "give '{key}.{sub}' of '{}' a static value or drop it from the spread",
                    site.name
                )],
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
            ctx.warn_help(
                site.span,
                DiagnosticCode::PartialObjectProp,
                format!(
                    "property '{key}.{sub}' of '{}' drops a dynamic arm with no static style value",
                    site.name
                ),
                vec![format!(
                    "make the dynamic arm of '{key}.{sub}' of '{}' static or drop it",
                    site.name
                )],
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
        lower_const_object(
            ctx,
            &prop.nested,
            LowerSite {
                name: site.name,
                when: &nested_when,
                span: site.span,
            },
        );
    }
    if prop.leaves.is_empty() {
        if prop.nested.is_empty() {
            // { _hover: pick() }  — recorded but unlowerable; name it
            ctx.warn_help(
                site.span,
                DiagnosticCode::UnfoldableObjectProp,
                format!(
                    "property '{key}' of '{}' has no static style value",
                    site.name
                ),
                vec![format!(
                    "give '{key}' of '{}' a static value or drop it from the spread",
                    site.name
                )],
            );
        } else if prop.residue {
            // The nested entries lowered above; name the dropped value arm
            // a union merged beside them
            ctx.warn_help(
                site.span,
                DiagnosticCode::PartialObjectProp,
                format!(
                    "property '{key}' of '{}' drops a dynamic arm with no static style value",
                    site.name
                ),
                vec![format!(
                    "make the dynamic arm of '{key}' of '{}' static or drop it",
                    site.name
                )],
            );
        }
        return;
    }
    // { _hover: 'red' }  — a condition block must be an object, as inline
    ctx.warn_help(
        site.span,
        DiagnosticCode::NonObjectCondition,
        "Condition block expected object expression",
        vec![format!("give condition '{key}' a style object")],
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
        lower_const_object(ctx, &prop.nested, *site);
    }
    if prop.leaves.is_empty() && prop.nested.is_empty() {
        // { css: pick() }  — recorded but unlowerable; name it
        ctx.warn_help(
            site.span,
            DiagnosticCode::UnfoldableObjectProp,
            format!(
                "property '{key}' of '{}' has no static style value",
                site.name
            ),
            vec![format!(
                "give '{key}' of '{}' a static value or drop it from the spread",
                site.name
            )],
        );
    } else if prop.residue {
        // The kept side lowered (or stayed silent); name the dropped arm
        ctx.warn_help(
            site.span,
            DiagnosticCode::PartialObjectProp,
            format!(
                "property '{key}' of '{}' drops a dynamic arm with no static style value",
                site.name
            ),
            vec![format!(
                "make the dynamic arm of '{key}' of '{}' static or drop it",
                site.name
            )],
        );
    }
}

#[cfg(test)]
mod tests;

pub(crate) use r::lower_r_entry;
mod r;

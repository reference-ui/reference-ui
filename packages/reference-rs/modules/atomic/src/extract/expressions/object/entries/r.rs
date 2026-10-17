//! The `r` key of a recorded const object: its sub-keys scope their nested objects under container
//! queries. `lower_r_entry` walks each sub-key of a recorded `r` entry, refusing unknown or scalar
//! sub-keys the way inline `r` keys do, and `lower_r_sub` lowers one sub-key's nested object under
//! its query. Only reached under `JsxAttributes`; style objects warn on `r` instead. Takes the
//! object walk, the lowering site, and the recorded entry; emits wants, authored plans, and
//! diagnostics.

use super::super::{keys::resolve_r_key, lower::LowerSite, lower_const_object, ObjectWalk};
use crate::diagnostics::DiagnosticCode;
use crate::extract::constants::ObjectProp;
use crate::extract::suggest;

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
        let Some(query) = resolve_r_key(trimmed, ctx.breakpoints) else {
            // r: { wat: {...} }  — unknown, like the inline key
            let help = suggest::suggestion_lines(
                suggest::suggest_breakpoint(trimmed, ctx.breakpoints),
                "use a breakpoint from the theme".to_string(),
            );
            ctx.warn_help(
                site.span,
                DiagnosticCode::UnknownBreakpoint,
                format!("Unknown breakpoint name in r prop: \"{trimmed}\""),
                help,
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
        lower_const_object(
            ctx,
            &sub.subprop.nested,
            LowerSite {
                name: site.name,
                when: &sub_when,
                span: site.span,
            },
        );
    }
    if sub.subprop.leaves.is_empty() {
        if sub.subprop.nested.is_empty() {
            // r: { md: pick() }  — recorded but unlowerable; name it
            ctx.warn_help(
                site.span,
                DiagnosticCode::UnfoldableObjectProp,
                format!(
                    "property '{}.{}' of '{}' has no static style value",
                    sub.key, sub.sub, site.name
                ),
                vec![format!(
                    "give '{}.{}' of '{}' a static value or drop it from the spread",
                    sub.key, sub.sub, site.name
                )],
            );
        } else if sub.subprop.residue {
            // The nested entries lowered above; name the dropped value arm
            ctx.warn_help(
                site.span,
                DiagnosticCode::PartialObjectProp,
                format!(
                    "property '{}.{}' of '{}' drops a dynamic arm with no static style value",
                    sub.key, sub.sub, site.name
                ),
                vec![format!(
                    "make the dynamic arm of '{}.{}' of '{}' static or drop it",
                    sub.key, sub.sub, site.name
                )],
            );
        }
        return;
    }
    // r: { md: '1r' }  — a condition block must be an object, as inline
    ctx.warn_help(
        site.span,
        DiagnosticCode::NonObjectCondition,
        "Condition block expected object expression",
        vec![format!(
            "give condition '{}.{}' a style object",
            sub.key, sub.sub
        )],
    );
}

//! Style-object keys: static folding, residue warnings, and the `r` prop.
//! Keys fold through the shared key node, so static spellings and single-leaf
//! const keys resolve alike; a folded key that read a partially static entry
//! warns through the residue channel. The `r` prop object maps each key to a
//! container query that scopes its nested styles, refusing unknown names.

use oxc_ast::ast::{ObjectExpression, ObjectPropertyKind, PropertyKey};
use oxc_span::GetSpan;
use smallvec::SmallVec;

use super::{condition::handle_condition_value, ObjectWalk};
use crate::diagnostics::DiagnosticCode;
use crate::extract::scope::Scoped;
use crate::resolve::r;
use base_system::BreakpointScale;

/// Walk an `r` prop object: each key becomes an `@container` condition wrapping nested styles.
pub fn walk_r_object(
    ctx: &mut ObjectWalk<'_>,
    obj: &ObjectExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // r={{ 300: { p: '1r' }, md: { mt: '2r' }, "card/md": { p: '1r' } }}
    for prop_kind in &obj.properties {
        let ObjectPropertyKind::ObjectProperty(prop) = prop_kind else {
            continue;
        };
        let Some(raw_key) = resolve_property_key(&prop.key, ctx.scopes) else {
            continue;
        };
        warn_key_residue(ctx, &prop.key);
        let trimmed = raw_key.trim();
        let Some(query) = resolve_r_key(trimmed, ctx.breakpoints) else {
            // r={{ wat: { p: '1r' } }}
            ctx.warn(
                prop.key.span(),
                DiagnosticCode::UnknownBreakpoint,
                format!("Unknown breakpoint name in r prop: \"{trimmed}\""),
            );
            continue;
        };
        let mut nested_when = when.clone();
        nested_when.push(query.into());
        handle_condition_value(ctx, &prop.value, &nested_when);
    }
}

pub(crate) fn resolve_r_key(key: &str, scale: &BreakpointScale) -> Option<String> {
    if let Some((container, bp)) = key.split_once('/') {
        r::lower_r_key_named(bp.trim(), scale, container.trim())
    } else if let Some((bp, container)) = key.split_once('@') {
        r::lower_r_key_named(bp.trim(), scale, container.trim())
    } else {
        r::lower_r_key(key, scale)
    }
}

/// Fold a style-object key through the shared key node: static spellings
/// resolve as before, and single-leaf const keys (`[k]`, `[t.p]`) fold to
/// their value. Callers warn `UnfoldableKey` on None with siblings kept.
pub(crate) fn resolve_property_key(key: &PropertyKey<'_>, scoped: Scoped<'_>) -> Option<String> {
    crate::extract::fold::fold_property_key(key, scoped)
}

/// Warn when a folded key read a partially static entry (Ph4 residue
/// channel). Callers run this only after the key folds: a refused key
/// already warns `UnfoldableKey`, never both.
pub(crate) fn warn_key_residue(ctx: &mut ObjectWalk<'_>, key: &PropertyKey<'_>) {
    if let Some(path) = crate::extract::fold::key_entry_residue(key, ctx.scopes) {
        ctx.warn(
            key.span(),
            DiagnosticCode::PartialObjectProp,
            format!("property '{path}' drops a dynamic arm with no static style value"),
        );
    }
}

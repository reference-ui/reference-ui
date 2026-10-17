//! Array destructuring against const array sources.
//! Each listed element binds the positional slot it selects; holes fire
//! defaults while dynamic slots hold their runtime value and feed the
//! shadow. Rest binds the trailing slots as a const array, darkening
//! entirely when any sliced slot is dynamic (the recorded array has no
//! dynamic marker, and a hole would wrongly fire a later default).

mod rest;
mod source;

use std::collections::BTreeMap;

use oxc_ast::ast::{ArrayPattern, BindingPattern, Expression};

use super::super::table::ScopeId;
use super::super::value::KeyProvenance;
use super::{default_value, push_leaves, shadow_binding, LeavesBind, PatternBind, PatternCtx};
use crate::atom::AtomValue;

use self::rest::bind_array_rest;
use self::source::resolve_array_source;

/// One positional array slot: a static leaf, a hole, or a dynamic value.
/// Holes (`undefined`) fire defaults; dynamic slots hold their runtime
/// value, so they feed the shadow even under a default.
#[derive(Clone)]
enum ArraySlot {
    Leaf(AtomValue),
    Hole,
    Dynamic,
}

/// A resolved array source: positional slots plus per-index provenance.
struct ArraySource {
    elements: Vec<ArraySlot>,
    provenances: BTreeMap<usize, KeyProvenance>,
    /// The source binding when the source is an identifier (for root deps).
    root: Option<(ScopeId, String)>,
}

/// One array element a pattern lists: its index plus the value pattern.
struct ListedSlot<'a> {
    index: usize,
    element: &'a BindingPattern<'a>,
}

/// Bind an array pattern's names against its init.
pub(crate) fn bind_array_pattern(
    ctx: &PatternCtx<'_, '_>,
    pattern: &BindingPattern<'_>,
    arr: &ArrayPattern<'_>,
    init: Option<&Expression<'_>>,
) -> PatternBind {
    let Some(source) = resolve_array_source(ctx, init) else {
        return PatternBind::shadowed(ctx, pattern);
    };
    let mut out = PatternBind::empty();
    for (index, element) in arr.elements.iter().enumerate() {
        let Some(element) = element else {
            continue;
        };
        bind_listed_slot(ctx, &source, ListedSlot { index, element }, &mut out);
    }
    bind_array_rest(ctx, arr, &source, &mut out);
    out
}

/// Bind one listed slot: the element, its default, or a shadow.
fn bind_listed_slot(
    ctx: &PatternCtx<'_, '_>,
    source: &ArraySource,
    slot: ListedSlot<'_>,
    out: &mut PatternBind,
) {
    // const [small, medium] = sizes
    let resolved = source
        .elements
        .get(slot.index)
        .cloned()
        .unwrap_or(ArraySlot::Hole);
    if let BindingPattern::BindingIdentifier(id) = slot.element {
        let ArraySlot::Leaf(leaf) = resolved else {
            out.bindings
                .push(shadow_binding(ctx, id.name.as_str(), id.span));
            return;
        };
        push_leaves(
            ctx,
            LeavesBind {
                name: id.name.as_str(),
                span: id.span,
                leaves: vec![leaf],
                residue: false,
                entry: source.provenances.get(&slot.index).cloned(),
                key: None,
                root: source.root.clone(),
            },
            out,
        );
        return;
    }
    if let BindingPattern::AssignmentPattern(assign) = slot.element {
        let defaulted = DefaultedSlot {
            index: slot.index,
            slot: resolved,
            assign,
        };
        bind_defaulted_slot(ctx, source, defaulted, out);
        return;
    }
    // const [[deep]] = nested  — nested defers to SITE-29
    PatternBind::shadowed(ctx, slot.element).drain_into(out);
}

/// A defaulted array slot: its index, its resolved slot, and its pattern.
struct DefaultedSlot<'a> {
    index: usize,
    slot: ArraySlot,
    assign: &'a oxc_ast::ast::AssignmentPattern<'a>,
}

/// Bind a defaulted slot: leaves win, holes fall to the default, dynamic shadows.
fn bind_defaulted_slot(
    ctx: &PatternCtx<'_, '_>,
    source: &ArraySource,
    slot: DefaultedSlot<'_>,
    out: &mut PatternBind,
) {
    let BindingPattern::BindingIdentifier(id) = &slot.assign.left else {
        PatternBind::shadowed(ctx, &slot.assign.left).drain_into(out);
        return;
    };
    if let ArraySlot::Leaf(leaf) = slot.slot {
        push_leaves(
            ctx,
            LeavesBind {
                name: id.name.as_str(),
                span: id.span,
                leaves: vec![leaf],
                residue: false,
                entry: source.provenances.get(&slot.index).cloned(),
                key: None,
                root: source.root.clone(),
            },
            out,
        );
        return;
    }
    if matches!(slot.slot, ArraySlot::Dynamic) {
        // [fn()][0] holds its runtime value — the default never fires there.
        out.bindings
            .push(shadow_binding(ctx, id.name.as_str(), id.span));
        return;
    }
    let Some((leaf, default_dep, residue)) = default_value(ctx, &slot.assign.right) else {
        out.bindings
            .push(shadow_binding(ctx, id.name.as_str(), id.span));
        return;
    };
    push_leaves(
        ctx,
        LeavesBind {
            name: id.name.as_str(),
            span: id.span,
            leaves: vec![leaf],
            residue,
            entry: default_dep,
            key: None,
            root: source.root.clone(),
        },
        out,
    );
}

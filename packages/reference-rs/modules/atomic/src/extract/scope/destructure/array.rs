//! Array destructuring against const array sources.
//! Each listed element binds the positional slot it selects; holes fire
//! defaults while dynamic slots hold their runtime value and feed the
//! shadow. Rest binds the trailing slots as a const array, darkening
//! entirely when any sliced slot is dynamic (the recorded array has no
//! dynamic marker, and a hole would wrongly fire a later default).

use std::collections::BTreeMap;

use oxc_ast::ast::{ArrayPattern, BindingPattern, Expression};

use super::super::binding::{Binding, BindingInit};
use super::super::table::ScopeId;
use super::super::value::{self, Dep, DepKey, KeyProvenance};
use super::{
    default_value, push_leaves, shadow_binding, slot_value, LeavesBind, PatternBind, PatternCtx,
};
use crate::atom::AtomValue;
use crate::extract::constants::ConstArrayElement;

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
    ctx: &PatternCtx<'_>,
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
    ctx: &PatternCtx<'_>,
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
    ctx: &PatternCtx<'_>,
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
    let Some((leaf, default_dep)) = default_value(ctx, &slot.assign.right) else {
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
            entry: default_dep,
            key: None,
            root: source.root.clone(),
        },
        out,
    );
}

/// Bind an array rest element to the trailing slots as a const array.
fn bind_array_rest(
    ctx: &PatternCtx<'_>,
    arr: &ArrayPattern<'_>,
    source: &ArraySource,
    out: &mut PatternBind,
) {
    let Some(rest) = &arr.rest else {
        return;
    };
    let BindingPattern::BindingIdentifier(id) = &rest.argument else {
        PatternBind::shadowed(ctx, &rest.argument).drain_into(out);
        return;
    };
    // const [first, ...rest] = sizes  — the tail from the rest's index on.
    // A dynamic slot darkens the whole rest: the recorded array has no
    // dynamic marker, and a hole would wrongly fire a later default.
    let tail_src: Vec<(usize, &ArraySlot)> = source
        .elements
        .iter()
        .enumerate()
        .skip(arr.elements.len())
        .collect();
    if tail_src
        .iter()
        .any(|(_, slot)| matches!(slot, ArraySlot::Dynamic))
    {
        out.bindings
            .push(shadow_binding(ctx, id.name.as_str(), id.span));
        return;
    }
    // One stale slot clears the whole rest: slot-level darkening would read
    // as a silent elision hole in use-site walkers.
    let mut tail = Vec::new();
    for (offset, slot) in &tail_src {
        match slot {
            ArraySlot::Leaf(leaf) => tail.push(ConstArrayElement::Leaf(leaf.clone())),
            _ => tail.push(ConstArrayElement::Hole),
        }
        if let Some(prov) = source.provenances.get(offset) {
            let dep = prov
                .clone()
                .into_dep(ctx.scope, id.name.as_str(), DepKey::Whole);
            out.deps.push(dep);
        }
    }
    out.bindings.push((
        id.name.to_string(),
        Binding {
            kind: ctx.kind.clone(),
            init: Some(BindingInit::Array(tail)),
            span: id.span,
        },
    ));
    if let Some((src_scope, src_name)) = &source.root {
        out.deps.push(Dep {
            scope: ctx.scope,
            name: id.name.to_string(),
            key: DepKey::Whole,
            src_scope: *src_scope,
            src_name: src_name.clone(),
            src_key: None,
        });
    }
}

/// Resolve an array pattern's source: an inline array or a bound array.
fn resolve_array_source(
    ctx: &PatternCtx<'_>,
    init: Option<&Expression<'_>>,
) -> Option<ArraySource> {
    let init = value::peel(init?);
    if let Expression::ArrayExpression(arr) = init {
        // const [a, b] = ['red', 'blue']
        return Some(inline_array_source(ctx, arr));
    }
    if let Expression::Identifier(id) = init {
        // const [small, medium] = sizes
        let (src_scope, binding) = ctx.table.resolve_from(id.name.as_str(), ctx.scope)?;
        if let Some(BindingInit::Array(elements)) = &binding.init {
            let mut slots = Vec::with_capacity(elements.len());
            for element in elements {
                match element {
                    ConstArrayElement::Leaf(leaf) => slots.push(ArraySlot::Leaf(leaf.clone())),
                    ConstArrayElement::Hole => slots.push(ArraySlot::Hole),
                    // An object element holds its runtime value — never a leaf.
                    ConstArrayElement::Object(_) => slots.push(ArraySlot::Dynamic),
                }
            }
            return Some(ArraySource {
                elements: slots,
                provenances: BTreeMap::new(),
                root: Some((src_scope, id.name.to_string())),
            });
        }
    }
    None
}

/// Slots being resolved from an inline array, until a blind spread ends them.
#[derive(Default)]
struct InlineSlots {
    elements: Vec<ArraySlot>,
    provenances: BTreeMap<usize, KeyProvenance>,
    blind: bool,
}

/// Positional slots of an inline array; a blind spread ends resolution.
fn inline_array_source(
    ctx: &PatternCtx<'_>,
    arr: &oxc_ast::ast::ArrayExpression<'_>,
) -> ArraySource {
    let mut slots = InlineSlots::default();
    for elem in &arr.elements {
        if slots.blind {
            slots.elements.push(ArraySlot::Dynamic);
            continue;
        }
        inline_array_element(ctx, elem, &mut slots);
    }
    ArraySource {
        elements: slots.elements,
        provenances: slots.provenances,
        root: None,
    }
}

/// Push one inline slot; an unresolvable spread blinds the tail.
fn inline_array_element(
    ctx: &PatternCtx<'_>,
    elem: &oxc_ast::ast::ArrayExpressionElement<'_>,
    slots: &mut InlineSlots,
) {
    use oxc_ast::ast::ArrayExpressionElement;
    if matches!(elem, ArrayExpressionElement::Elision(_)) {
        slots.elements.push(ArraySlot::Hole);
        return;
    }
    if let ArrayExpressionElement::SpreadElement(spread) = elem {
        if !splice_spread(ctx, &spread.argument, slots) {
            // [...unknown] shifts every later index unknowably — tail is dark.
            slots.elements.push(ArraySlot::Dynamic);
            slots.blind = true;
        }
        return;
    }
    let Some(expr) = elem.as_expression() else {
        slots.elements.push(ArraySlot::Dynamic);
        return;
    };
    let index = slots.elements.len();
    let Some((leaf, prov)) = slot_value(ctx, value::peel(expr)) else {
        slots.elements.push(ArraySlot::Dynamic);
        return;
    };
    if let Some(prov) = prov {
        slots.provenances.insert(index, prov);
    }
    slots.elements.push(ArraySlot::Leaf(leaf));
}

/// Splice a recorded array's leaves, or false when the spread is unresolvable.
fn splice_spread(ctx: &PatternCtx<'_>, argument: &Expression<'_>, slots: &mut InlineSlots) -> bool {
    let Expression::Identifier(id) = value::peel(argument) else {
        return false;
    };
    let Some((src_scope, binding)) = ctx.table.resolve_from(id.name.as_str(), ctx.scope) else {
        return false;
    };
    let Some(BindingInit::Array(recorded)) = &binding.init else {
        return false;
    };
    for element in recorded.clone() {
        let index = slots.elements.len();
        match element {
            ConstArrayElement::Leaf(leaf) => slots.elements.push(ArraySlot::Leaf(leaf)),
            ConstArrayElement::Hole => slots.elements.push(ArraySlot::Hole),
            ConstArrayElement::Object(_) => slots.elements.push(ArraySlot::Dynamic),
        }
        slots.provenances.insert(
            index,
            KeyProvenance {
                key: index.to_string(),
                src_scope,
                src_name: id.name.to_string(),
                src_key: None,
            },
        );
    }
    true
}

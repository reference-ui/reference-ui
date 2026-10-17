//! Rest binding for array destructuring: the trailing slots of a const array source. A dynamic tail
//! slot darkens the whole rest, because the recorded array carries no dynamic marker and a hole
//! would wrongly fire a later default. Otherwise the rest binds a new const array of the tail, with
//! one provenance dep per copied slot and a root dep on the source. Takes the pattern context, the
//! rest's array pattern, and the resolved source; emits bindings and deps into the caller's
//! `PatternBind`.

use oxc_ast::ast::{ArrayPattern, BindingPattern};

use super::super::super::binding::{Binding, BindingInit};
use super::super::super::value::{Dep, DepKey};
use super::super::{shadow_binding, PatternBind, PatternCtx};
use super::{ArraySlot, ArraySource};
use crate::extract::constants::ConstArrayElement;

/// Bind an array rest element to the trailing slots as a const array.
pub(super) fn bind_array_rest(
    ctx: &PatternCtx<'_, '_>,
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
    let tail: Vec<ConstArrayElement> = tail_src
        .iter()
        .map(|(_, slot)| tail_element(slot))
        .collect();
    for (offset, _) in &tail_src {
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

/// One tail slot as the recorded array keeps it: a leaf keeps its value, anything else is a hole.
fn tail_element(slot: &ArraySlot) -> ConstArrayElement {
    match slot {
        ArraySlot::Leaf(leaf) => ConstArrayElement::Leaf(leaf.clone()),
        _ => ConstArrayElement::Hole,
    }
}

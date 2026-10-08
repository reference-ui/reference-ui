//! Static member-path reads over nested const objects (`tokens.colors.red`).
//!
//! [`member_path_leaves`] resolves one static member expression to its
//! recorded scalar leaves across any number of hops, and
//! [`member_path_object`] resolves a member path to the nested entries it
//! names for member-hop spreads (`...styles.hover`). Both unwrap `!` on the
//! base (`tokens!.color`) and return nothing on any miss, so callers fall
//! back to today's `DynamicMember` diagnostic unchanged. Computed reads and
//! `?.` chains refuse here — they belong to the element and chain nodes.

use oxc_ast::ast::{Expression, StaticMemberExpression};

use super::operand::peel_wrappers;
use crate::atom::AtomValue;
use crate::extract::constants::ConstObject;
use crate::extract::scope::Scoped;

/// Scalar leaves for one static member path, or empty when unresolved.
///
/// `theme.primary` reads the recorded entry; `tokens.colors.red` walks the
/// nested maps; branch members fan out. A miss, an empty marker, a scalar
/// mid-path, or a non-identifier root yields nothing, and the caller
/// re-walks the member into its usual diagnostic.
pub fn member_path_leaves(mem: &StaticMemberExpression<'_>, scoped: Scoped<'_>) -> Vec<AtomValue> {
    let Some((root, segments)) = split_path(mem) else {
        return Vec::new();
    };
    walk_segments(root, &segments, scoped).map_or(Vec::new(), |hit| match hit {
        PathHit::Leaves(leaves) => leaves,
        PathHit::Object(_) | PathHit::Missing => Vec::new(),
    })
}

/// Nested entries for one static member path, or None when unresolved.
///
/// `...styles.hover` spreads the entries `hover` names; a scalar, a miss,
/// or a non-identifier root is not a spreadable object.
pub fn member_path_object<'a>(
    mem: &StaticMemberExpression<'_>,
    scoped: Scoped<'a>,
) -> Option<&'a ConstObject> {
    let (root, segments) = split_path(mem)?;
    match walk_segments(root, &segments, scoped)? {
        PathHit::Leaves(_) | PathHit::Missing => None,
        PathHit::Object(entries) => Some(entries),
    }
}

/// True when a member path's terminal entry kept leaves beside a dropped
/// dynamic arm (Ph4 residue channel). Intermediate hops name nested maps,
/// never consumed leaves, so only the terminal entry can carry the loss.
pub fn member_path_residue(mem: &StaticMemberExpression<'_>, scoped: Scoped<'_>) -> bool {
    let Some((root, segments)) = split_path(mem) else {
        return false;
    };
    let Some((terminal, hops)) = segments.split_first() else {
        return false;
    };
    if hops.is_empty() {
        return scoped.object_prop_residue(root, terminal);
    };
    let Some(last) = hops.last() else {
        return false;
    };
    let mut current = match scoped.member_object(root, last) {
        Some(entries) => entries,
        None => return false,
    };
    for segment in hops[..hops.len() - 1].iter().rev() {
        let Some(prop) = current.get(*segment) else {
            return false;
        };
        if prop.nested.is_empty() {
            return false;
        }
        current = &prop.nested;
    }
    current
        .get(*terminal)
        .is_some_and(|prop| prop.residue && !prop.leaves.is_empty())
}

/// The root identifier of a member path, for mutation checks.
///
/// Peels wrappers on every level (`tokens!.color` roots at `tokens`);
/// computed or call bases have no root name.
pub fn member_root_name<'a>(mem: &StaticMemberExpression<'a>) -> Option<&'a str> {
    split_path(mem).map(|(root, _)| root)
}

/// The dotted path text of a member expression for diagnostics.
///
/// Peels wrappers on every level, so `tokens!.color` prints `tokens.color`
/// and `tokens.colors.red` prints in full.
pub fn member_path_text(mem: &StaticMemberExpression<'_>) -> String {
    let Some((root, segments)) = split_path(mem) else {
        return mem.property.name.as_str().to_string();
    };
    let mut parts = vec![root.to_string()];
    for segment in segments.iter().rev() {
        parts.push((*segment).to_string());
    }
    parts.join(".")
}

/// What one path walk found: terminal leaves, a nested map, or a miss.
enum PathHit<'a> {
    Leaves(Vec<AtomValue>),
    Object(&'a ConstObject),
    Missing,
}

/// Split a member expression into its root name and leaf-first segments.
///
/// `tokens.colors.red` roots at `tokens` with segments `red`, `colors`.
/// Non-identifier bases (calls, computed reads) are not static paths.
fn split_path<'a>(mem: &StaticMemberExpression<'a>) -> Option<(&'a str, Vec<&'a str>)> {
    let mut segments = vec![mem.property.name.as_str()];
    let mut base = peel_wrappers(&mem.object);
    while let Expression::StaticMemberExpression(inner) = base {
        segments.push(inner.property.name.as_str());
        base = peel_wrappers(&inner.object);
    }
    let Expression::Identifier(root) = base else {
        return None;
    };
    Some((root.name.as_str(), segments))
}

/// Walk root-to-leaf segments to terminal leaves or entries.
///
/// Segments collect leaf-first, so intermediate hops run in reverse: each
/// hop must name a nested object, and the terminal contributes its recorded
/// leaves or its nested map. Anything else is a miss.
fn walk_segments<'a>(root: &str, segments: &[&str], scoped: Scoped<'a>) -> Option<PathHit<'a>> {
    let (terminal, hops) = segments.split_first()?;
    if hops.is_empty() {
        return Some(single_hop(root, terminal, scoped));
    }
    let mut current = scoped.member_object(root, hops.last()?)?;
    for segment in hops[..hops.len() - 1].iter().rev() {
        current = nested_object(current, segment)?;
    }
    Some(terminal_hit(current, terminal))
}

/// A one-hop path: the recorded leaves, or the nested map when scalar-empty.
///
/// Pure objects (leaves empty, entries present) answer as objects so
/// spreads lower them; scalar entries answer as leaves for value position.
fn single_hop<'a>(root: &str, terminal: &str, scoped: Scoped<'a>) -> PathHit<'a> {
    let leaves = scoped.object_prop_leaves(root, terminal);
    if !leaves.is_empty() {
        return PathHit::Leaves(leaves.to_vec());
    }
    scoped
        .member_object(root, terminal)
        .map_or(PathHit::Missing, PathHit::Object)
}

/// A multi-hop terminal: its recorded leaves, or its nested map, or a miss.
fn terminal_hit<'a>(entries: &'a ConstObject, terminal: &str) -> PathHit<'a> {
    let Some(prop) = entries.get(terminal) else {
        return PathHit::Missing;
    };
    if !prop.leaves.is_empty() {
        return PathHit::Leaves(prop.leaves.clone());
    }
    if !prop.nested.is_empty() {
        return PathHit::Object(&prop.nested);
    }
    PathHit::Missing
}

/// The nested entries under one intermediate segment, if it holds an object.
fn nested_object<'a>(entries: &'a ConstObject, segment: &str) -> Option<&'a ConstObject> {
    let prop = entries.get(segment)?;
    if prop.nested.is_empty() {
        return None;
    }
    Some(&prop.nested)
}

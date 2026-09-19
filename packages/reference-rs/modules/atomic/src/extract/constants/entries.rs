//! Recorded entries of a const style-object initializer, shared by both collectors.
//! The project bag (`collect.rs`) and the scope table (`scope/init.rs`) lower
//! object inits through this one function, so a const object means the same
//! thing in both indexes. Each static-keyed entry carries its literal leaves,
//! both arms of a branching value, or a nested entry map; anything else
//! records an empty marker so the use site can diagnose it instead of going
//! silent (SPEC-V2-55/65). A branching value that keeps a static leaf while
//! dropping a dynamic arm sets the entry's residue flag at collect time, so
//! the use site can diagnose the loss (Ph4 residue channel). Inline spreads
//! merge here — sequential spreads overwrite like last-wins, conditional and
//! logical spreads union every inline arm (SPEC-V2-24) — while computed keys
//! stay unrecorded and identifier spreads resolve in the scope layer (SPEC-V2-34).

use std::collections::BTreeMap;

use oxc_ast::ast::{Expression, ObjectExpression, ObjectPropertyKind, PropertyKey};

use crate::atom::AtomValue;
use crate::extract::expressions::walk::is_guard_expression;

/// A recorded const style object: static keys to their recorded entries.
pub type ConstObject = BTreeMap<String, ObjectProp>;

/// One recorded entry of a const style object: its static leaves plus, for
/// a nested object literal, the nested entries one level down. Empty leaves
/// with an empty map mark a dynamic value (call, identifier, member), which
/// the use site diagnoses — never silently skipped, never a ghost. The
/// residue flag marks a partially static entry: leaves were kept while a
/// dynamic arm was dropped at collect time, which the use site diagnoses.
#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct ObjectProp {
    /// Literal and branching leaves (`'red'`, both arms of `flag ? 'r' : 'b'`).
    pub leaves: Vec<AtomValue>,
    /// Nested entries (`{ colors: { primary: 'blue' } }`).
    pub nested: ConstObject,
    /// True when a dynamic arm was dropped beside the kept leaves.
    pub residue: bool,
}

impl ObjectProp {
    /// True when the entry carries nothing lowerable (a dynamic value).
    pub fn is_empty(&self) -> bool {
        self.leaves.is_empty() && self.nested.is_empty()
    }
}

/// The canonical spelling of a numeric key: integers print without decimals.
///
/// One spelling shared by the recorders and the fold nodes, so a recorded
/// `500` always meets a folded `'500'` index or `['col'+'or']`-style key.
pub fn canonical_numeric_key(n: f64) -> String {
    // 300:  /  [42]:
    if n.fract() == 0.0 && n.is_finite() {
        format!("{}", n as i64)
    } else {
        n.to_string()
    }
}

/// Lower every static-keyed entry of a const object initializer.
pub fn object_entries(obj: &ObjectExpression<'_>) -> ConstObject {
    // const theme = { primary: 'n300', tone: flag ? 'r' : 'b' }
    let mut entries = ConstObject::new();
    for prop_kind in &obj.properties {
        if let ObjectPropertyKind::SpreadProperty(spread) = prop_kind {
            // { ...{ mt: '2r' } }  — sequential spreads overwrite, last-wins
            if let Some(spread_entries) = inline_spread_entries(&spread.argument) {
                entries.extend(spread_entries);
            }
            continue;
        }
        let ObjectPropertyKind::ObjectProperty(prop) = prop_kind else {
            continue;
        };
        let Some(key) = property_key(&prop.key) else {
            continue;
        };
        entries.insert(key, prop_from_expr(unwrap_entry(&prop.value)));
    }
    entries
}

/// Entries contributed by an inline spread argument, or None when the spread
/// needs name resolution (the scope layer owns identifiers and members).
fn inline_spread_entries(arg: &Expression<'_>) -> Option<ConstObject> {
    let arg = unwrap_entry(arg);
    if let Expression::ObjectExpression(obj) = arg {
        // { ...{ mt: '2r' } }
        return Some(object_entries(obj));
    }
    if let Expression::ConditionalExpression(cond) = arg {
        return conditional_spread_entries(cond);
    }
    if let Expression::LogicalExpression(log) = arg {
        return logical_spread_entries(log);
    }
    None
}

/// Union the inline-object arms of a conditional spread (SPEC-V2-24).
///
/// Same-key leaves concatenate and nested maps merge, so both runtime arms
/// lower downstream — exactly like a top-level conditional spread, and the
/// only sound choice where last-wins is meaningless. Non-inline arms stay
/// out here; the scope layer resolves names beside these entries.
fn conditional_spread_entries(
    cond: &oxc_ast::ast::ConditionalExpression<'_>,
) -> Option<ConstObject> {
    let mut merged = ConstObject::new();
    let mut inline = false;
    for arm in [&cond.consequent, &cond.alternate] {
        if let Expression::ObjectExpression(obj) = unwrap_entry(arm) {
            union_entries(&mut merged, object_entries(obj));
            inline = true;
        }
    }
    if inline {
        Some(merged)
    } else {
        None
    }
}

/// Merge the inline-object operands of a logical spread.
///
/// Non-guard operands lower, mirroring the top-level walk; guards
/// contribute nothing. Non-inline operands stay out, as for conditionals.
fn logical_spread_entries(log: &oxc_ast::ast::LogicalExpression<'_>) -> Option<ConstObject> {
    let mut merged = ConstObject::new();
    let mut inline = false;
    for side in [&log.left, &log.right] {
        if is_guard_expression(side) {
            continue;
        }
        if let Expression::ObjectExpression(obj) = unwrap_entry(side) {
            union_entries(&mut merged, object_entries(obj));
            inline = true;
        }
    }
    if inline {
        Some(merged)
    } else {
        None
    }
}

/// Union spread entries into the accumulated map: same-key leaves
/// concatenate (deduped, like branch leaves) and nested maps merge
/// recursively, so every recorded runtime outcome lowers downstream.
fn union_entries(into: &mut ConstObject, from: ConstObject) {
    for (key, prop) in from {
        union_entry(into, key, prop);
    }
}

/// Union one spread entry into the accumulated map, shared with the scope
/// layer so branching spreads record identically in both collectors.
/// Residue unions too: an empty marker merged beside kept leaves is a
/// dropped dynamic arm, exactly like a partially static branch.
pub(crate) fn union_entry(into: &mut ConstObject, key: String, prop: ObjectProp) {
    match into.get_mut(&key) {
        Some(existing) => {
            let dropped = prop.residue || prop.is_empty();
            for leaf in prop.leaves {
                push_leaf(&mut existing.leaves, leaf);
            }
            union_entries(&mut existing.nested, prop.nested);
            existing.residue |= dropped;
        }
        None => {
            into.insert(key, prop);
        }
    }
}

/// Lower one entry value: literals, branching leaves, or a nested map.
/// A branching value that keeps leaves while dropping a dynamic arm records
/// the residue flag beside them; a value with no static leaf at all stays an
/// empty marker, which the use site diagnoses on its own path.
fn prop_from_expr(expr: &Expression<'_>) -> ObjectProp {
    if let Some(leaf) = literal_leaf(expr) {
        // { primary: 'n300' }
        return ObjectProp {
            leaves: vec![leaf],
            nested: ConstObject::new(),
            residue: false,
        };
    }
    if matches!(
        expr,
        Expression::ConditionalExpression(_) | Expression::LogicalExpression(_)
    ) {
        // { tone: flag ? 'red' : 'blue' } — both arms, like the want walker
        let mut leaves = Vec::new();
        let mut dropped = false;
        collect_branching_leaves(expr, &mut leaves, &mut dropped);
        return ObjectProp {
            residue: !leaves.is_empty() && dropped,
            leaves,
            nested: ConstObject::new(),
        };
    }
    if let Expression::ObjectExpression(nested) = expr {
        // { colors: { primary: 'blue' } }
        return ObjectProp {
            leaves: Vec::new(),
            nested: object_entries(nested),
            residue: false,
        };
    }
    // { color: pick() } — empty marker; the use site diagnoses it
    ObjectProp::default()
}

/// Scoop every literal leaf of a branching entry, mirroring the want
/// walker leaf-for-leaf: both ternary arms, non-guard logical operands.
/// A non-guard leaf position with no literal sets the dropped flag.
fn collect_branching_leaves(expr: &Expression<'_>, out: &mut Vec<AtomValue>, dropped: &mut bool) {
    let unwrapped = unwrap_entry(expr);
    if collect_conditional_leaves(unwrapped, out, dropped) {
        return;
    }
    if collect_logical_leaves(unwrapped, out, dropped) {
        return;
    }
    if let Some(atom) = literal_leaf(unwrapped) {
        push_leaf(out, atom);
    } else {
        *dropped = true;
    }
}

/// Scoop both arms of a ternary entry, or false when not a ternary.
fn collect_conditional_leaves(
    expr: &Expression<'_>,
    out: &mut Vec<AtomValue>,
    dropped: &mut bool,
) -> bool {
    let Expression::ConditionalExpression(cond) = expr else {
        return false;
    };
    collect_branching_leaves(&cond.consequent, out, dropped);
    collect_branching_leaves(&cond.alternate, out, dropped);
    true
}

/// Scoop the non-guard operands of a logical entry, or false when not logical.
fn collect_logical_leaves(
    expr: &Expression<'_>,
    out: &mut Vec<AtomValue>,
    dropped: &mut bool,
) -> bool {
    let Expression::LogicalExpression(log) = expr else {
        return false;
    };
    if !is_guard_expression(&log.left) {
        collect_branching_leaves(&log.left, out, dropped);
    }
    if !is_guard_expression(&log.right) {
        collect_branching_leaves(&log.right, out, dropped);
    }
    true
}

/// Push a leaf unless an equal leaf is already recorded.
fn push_leaf(out: &mut Vec<AtomValue>, leaf: AtomValue) {
    if !out.contains(&leaf) {
        out.push(leaf);
    }
}

/// A literal entry leaf, or None for dynamic shapes.
fn literal_leaf(expr: &Expression<'_>) -> Option<AtomValue> {
    match expr {
        Expression::StringLiteral(s) => Some(AtomValue::String(s.value.as_str().into())),
        Expression::NumericLiteral(n) => {
            Some(AtomValue::Number(n.value.to_string().into_boxed_str()))
        }
        Expression::BooleanLiteral(b) => Some(AtomValue::Bool(b.value)),
        _ => None,
    }
}

/// A static entry key, or None for computed and exotic keys.
fn property_key(key: &PropertyKey<'_>) -> Option<String> {
    match key {
        PropertyKey::StaticIdentifier(ident) => {
            // { primary: 'n300' }
            Some(ident.name.to_string())
        }
        PropertyKey::StringLiteral(lit) => {
            // { 'primary': 'n300' }
            Some(lit.value.to_string())
        }
        PropertyKey::NumericLiteral(lit) => {
            // { 500: 'red' }  — numerics record canonically, verbatim v2
            Some(canonical_numeric_key(lit.value))
        }
        _ => None,
    }
}

/// Peel transparent wrappers (parens, `as`, `satisfies`, `!`) off an entry.
fn unwrap_entry<'a, 'b>(expr: &'b Expression<'a>) -> &'b Expression<'a> {
    match expr {
        Expression::ParenthesizedExpression(p) => {
            // { primary: ('n300') }
            unwrap_entry(&p.expression)
        }
        Expression::TSAsExpression(as_expr) => {
            // { primary: 'n300' as const }
            unwrap_entry(&as_expr.expression)
        }
        Expression::TSSatisfiesExpression(sat) => {
            // { primary: 'n300' satisfies string }
            unwrap_entry(&sat.expression)
        }
        Expression::TSNonNullExpression(non_null) => {
            // { primary: 'n300'! }
            unwrap_entry(&non_null.expression)
        }
        _ => expr,
    }
}

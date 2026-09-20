//! Shared const values for independent diagnostics analysis.
//!
//! Resolves identifiers and static member chains through the compiler's
//! recorded const values, and spells atoms and `!` markers exactly like the
//! engine's authored values. Resolution is strict: shadowed names never
//! resolve, mutated bindings never resolve, and multi-leaf branching names
//! never resolve — predicting one branch while runtime takes another would
//! forge an exact key.

use oxc_ast::ast::Expression;
use serde_json::{json, Value};

use super::values::{ValueClass, ValueScope};
use crate::atom::AtomValue;
use crate::extract::constants::LocalConstants;

/// One const scalar by name: exactly one recorded leaf, never shadowed,
/// never mutated.
pub fn resolve_const_scalar(name: &str, scope: &ValueScope<'_>) -> Option<AtomValue> {
    if scope.is_shadowed(name) || scope.constants.mutation(name).is_some() {
        return None;
    }
    let leaves = scope.constants.scalar_leaves(name);
    if leaves.len() != 1 {
        return None;
    }
    leaves.first().cloned()
}

/// One static member chain (`theme.primary`) as its recorded leaf atom: the
/// root must be an unshadowed, unmutated const object and every step must
/// land on a fully static entry. Residue or multi-leaf entries refuse.
pub fn resolve_member_atom(expr: &Expression<'_>, scope: &ValueScope<'_>) -> Option<AtomValue> {
    let (root, segments) = collect_segments(expr)?;
    if scope.is_shadowed(root) || scope.constants.mutation(root).is_some() {
        return None;
    }
    walk_segments(scope.constants, root, &segments)
}

/// The root name and member segments of one static chain, or None unless
/// the chain bottoms out at an identifier.
fn collect_segments<'a>(expr: &'a Expression<'a>) -> Option<(&'a str, Vec<String>)> {
    let mut segments = Vec::new();
    let mut cursor = expr;
    while let Expression::StaticMemberExpression(member) = cursor {
        segments.push(member.property.name.to_string());
        cursor = &member.object;
    }
    let Expression::Identifier(root) = cursor else {
        return None;
    };
    segments.reverse();
    Some((root.name.as_str(), segments))
}

/// Walk recorded object maps down the segments to one static leaf atom.
fn walk_segments(constants: &LocalConstants, root: &str, segments: &[String]) -> Option<AtomValue> {
    let mut map = constants.get_object(root)?;
    let (last, head) = segments.split_last()?;
    for segment in head {
        let prop = map.get(segment.as_str())?;
        if prop.residue {
            return None;
        }
        map = &prop.nested;
    }
    let prop = map.get(last.as_str())?;
    if prop.residue || !prop.nested.is_empty() || prop.leaves.len() != 1 {
        return None;
    }
    prop.leaves.first().cloned()
}

/// Split an `!important`/`!` suffix: byte-mirror of the engine's
/// `split_important_flag`, kept local so analysis never imports the
/// extraction walker it must stay independent of.
pub fn split_important(val: &str) -> (&str, bool) {
    if let Some(stripped) = strip_important_suffix(val) {
        (stripped.trim_end(), true)
    } else if val.len() > 1 && val.ends_with('!') {
        (&val[..val.len() - 1], true)
    } else {
        (val, false)
    }
}

/// Strip a case-insensitive `!important` suffix, if present.
fn strip_important_suffix(val: &str) -> Option<&str> {
    const MARKER: &str = "!important";
    let head_len = val.len().checked_sub(MARKER.len())?;
    let tail = val.get(head_len..)?;
    if tail.eq_ignore_ascii_case(MARKER) {
        val.get(..head_len)
    } else {
        None
    }
}

/// One const atom as its leaf class: `false` and `null` are holes runtime
/// never queries (`css.ts` `isHole`), so they emit no fact. `true` stays
/// exact: runtime queries it and resolve drops it, which is a genuine
/// miss. The single hole mapping for every const leaf path.
pub fn atom_to_class(val: &AtomValue) -> ValueClass {
    if matches!(val, AtomValue::Bool(false) | AtomValue::Null) {
        return ValueClass::Hole;
    }
    match atom_to_json(val, true) {
        Some((value, important)) => ValueClass::Exact { value, important },
        None => ValueClass::Unknown,
    }
}

/// One const atom as JSON plus its important flag: strings split `!` when
/// asked (leaf positions) and stay raw otherwise (nested positions); token
/// atoms keep their `{"$token": …}` shape.
pub fn atom_to_json(val: &AtomValue, split: bool) -> Option<(Value, bool)> {
    match val {
        AtomValue::String(text) => Some(string_atom_to_json(text, split)),
        AtomValue::Number(text) => Some((number_atom_to_json(text), false)),
        AtomValue::Bool(flag) => Some((Value::Bool(*flag), false)),
        AtomValue::Null => Some((Value::Null, false)),
        AtomValue::Token { path, value } => Some((
            json!({ "$token": { "path": path.as_ref(), "value": value.as_ref() } }),
            false,
        )),
    }
}

/// One string atom as JSON: split `!` for leaves, raw for nested shapes.
fn string_atom_to_json(text: &str, split: bool) -> (Value, bool) {
    if split {
        let (clean, important) = split_important(text);
        (Value::String(clean.to_string()), important)
    } else {
        (Value::String(text.to_string()), false)
    }
}

/// One recorded numeric atom as JSON: integers print without decimals.
fn number_atom_to_json(text: &str) -> Value {
    if let Ok(int) = text.parse::<i64>() {
        json!(int)
    } else if let Ok(float) = text.parse::<f64>() {
        json!(float)
    } else {
        Value::String(text.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::super::support::{first_prop_value, parse_for_test};
    use super::super::values::{classify_value, ValueClass, ValueScope};
    use super::*;
    use std::collections::HashSet;

    fn classify_with_consts(source: &str) -> ValueClass {
        let allocator = oxc_allocator::Allocator::default();
        let program = parse_for_test(&allocator, source);
        let constants =
            crate::extract::constants::collect_local_constants(&program, "test.ts", Some(source));
        let shadows: Vec<HashSet<String>> = Vec::new();
        let scope = ValueScope {
            constants: &constants,
            shadows: &shadows,
        };
        let value = first_prop_value(&program);
        classify_value(value, &scope)
    }

    fn exact(value: Value, important: bool) -> ValueClass {
        ValueClass::Exact { value, important }
    }

    #[test]
    fn const_scalars_resolve_exact() {
        assert_eq!(
            classify_with_consts("const C = 'red'; css({ v: C })"),
            exact(json!("red"), false)
        );
        assert_eq!(
            classify_with_consts("const C = 'red!'; css({ v: C })"),
            exact(json!("red"), true)
        );
        assert_eq!(
            classify_with_consts("let C = 'a'; C = 'b'; css({ v: C })"),
            ValueClass::Unknown
        );
        assert_eq!(
            classify_with_consts("const C = ok ? 'a' : 'b'; css({ v: C })"),
            ValueClass::Unknown
        );
    }

    #[test]
    fn const_holes_emit_no_fact_and_true_stays_exact() {
        assert_eq!(
            classify_with_consts("const C = false; css({ v: C })"),
            ValueClass::Hole
        );
        assert_eq!(
            classify_with_consts("const N = null; css({ v: N })"),
            ValueClass::Hole
        );
        assert_eq!(
            classify_with_consts("const t = { v: false }; css({ v: t.v })"),
            ValueClass::Hole
        );
        assert_eq!(
            classify_with_consts("const T = true; css({ v: T })"),
            exact(json!(true), false)
        );
    }

    #[test]
    fn member_chains_resolve_through_const_objects() {
        assert_eq!(
            classify_with_consts("const t = { primary: 'n300' }; css({ v: t.primary })"),
            exact(json!("n300"), false)
        );
        assert_eq!(
            classify_with_consts("const t = { a: { b: 'x' } }; css({ v: t.a.b })"),
            exact(json!("x"), false)
        );
        assert_eq!(
            classify_with_consts("const t = { primary: 'n300' }; css({ v: t.missing })"),
            ValueClass::Unknown
        );
        assert_eq!(
            classify_with_consts("css({ v: props.w })"),
            ValueClass::Unknown
        );
    }
}

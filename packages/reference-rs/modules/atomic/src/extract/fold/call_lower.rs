//! Lowering folded call values into wants, spreads, and plans (SPEC-V2-39).
//!
//! Both extraction walkers lower [`FenceValue`] results through these
//! helpers so wants and authored plans agree by construction. Value
//! positions take scalar leaves, expand arrays onto breakpoint scopes, and
//! ride object keys onto condition scopes, mirroring the responsive walker.
//! Spread positions lower folded objects with full style-object semantics —
//! conditions nest, `r` keys resolve, unknown keys warn — mirroring the
//! inline-spread path. A JSX attribute bag instead keeps unknown keys silent
//! and lowers its `css` and `r` keys as their attributes, mirroring the
//! const-object bag path. Plans mirror the plan walker leaf for leaf: single
//! positions take the first fold, multi positions fan out.

use oxc_span::Span;
use serde_json::{Map, Value};
use smallvec::SmallVec;

use super::fence::FenceValue;
use crate::atom::AtomValue;
use crate::diagnostics::DiagnosticCode;
use crate::extract::expressions::literal::split_important_flag;
use crate::extract::expressions::{BagSemantics, ExpressionWalk, ObjectWalk};
use crate::extract::suggest;
use canon::is_known_style_prop;

/// Lower a folded call value at one style prop: leaves push, arrays fan
/// out onto breakpoints, and objects ride their keys onto `when` scopes.
pub fn lower_call_value(
    walk: &mut ExpressionWalk<'_>,
    value: &FenceValue,
    when: &SmallVec<[Box<str>; 2]>,
    span: Span,
) {
    match value {
        FenceValue::Leaves(leaves) => {
            for leaf in leaves {
                push_call_leaf(walk, leaf, when, span);
            }
        }
        FenceValue::Array(items) => lower_call_array(walk, items, when, span),
        FenceValue::Object(entries) => lower_call_object(walk, entries, when, span),
    }
}

/// Lower a folded array onto positional breakpoint scopes.
fn lower_call_array(
    walk: &mut ExpressionWalk<'_>,
    items: &[FenceValue],
    when: &SmallVec<[Box<str>; 2]>,
    span: Span,
) {
    for (index, item) in items.iter().enumerate() {
        let Some(breakpoint) = walk.breakpoint_for_index(index) else {
            continue;
        };
        let mut item_when = when.clone();
        item_when.push(Box::from(breakpoint));
        lower_call_value(walk, item, &item_when, span);
    }
}

/// Lower a folded object with its keys riding onto `when` scopes.
fn lower_call_object(
    walk: &mut ExpressionWalk<'_>,
    entries: &[(Box<str>, FenceValue)],
    when: &SmallVec<[Box<str>; 2]>,
    span: Span,
) {
    for (key, entry) in entries {
        let mut entry_when = when.clone();
        entry_when.push(key.clone());
        lower_call_value(walk, entry, &entry_when, span);
    }
}

/// Push one folded leaf: nulls omit, strings split important, rest push raw.
fn push_call_leaf(
    walk: &mut ExpressionWalk<'_>,
    leaf: &AtomValue,
    when: &SmallVec<[Box<str>; 2]>,
    span: Span,
) {
    match leaf {
        AtomValue::Null => {}
        AtomValue::String(text) => {
            let (clean, important) = split_important_flag(text);
            walk.push_want(
                AtomValue::String(clean.into()),
                when.clone(),
                important,
                Some(span),
            );
        }
        _ => {
            walk.push_want(leaf.clone(), when.clone(), false, Some(span));
        }
    }
}

/// Lower a folded spread object exactly as if spread: conditions nest, `r`
/// keys resolve, known props lower with plans. Unknown keys warn and drop in
/// style objects; a JSX attribute bag owns them and keeps them silent.
pub fn lower_call_spread(
    walk: &mut ObjectWalk<'_>,
    entries: &[(Box<str>, FenceValue)],
    when: &SmallVec<[Box<str>; 2]>,
    span: Span,
) {
    for (key, value) in entries {
        lower_call_entry(walk, value, EntrySite { when, span, key });
    }
}

/// Lower one folded spread entry by its key. A JSX attribute bag claims `css`
/// and `r` first; every other key takes the first style-object route that fits.
fn lower_call_entry(walk: &mut ObjectWalk<'_>, value: &FenceValue, site: EntrySite<'_>) {
    let key = site.key;
    let jsx_attrs = matches!(walk.bag, BagSemantics::JsxAttributes);
    if jsx_attrs && key == "css" {
        lower_call_css(walk, value, site.when, site.span);
        return;
    }
    if jsx_attrs && key == "r" {
        lower_call_r_attr(walk, value, site.when, site.span);
        return;
    }
    if key == "r" && matches!(value, FenceValue::Object(_)) {
        lower_call_r(walk, value, site.when, site.span);
        return;
    }
    if super::super::expressions::object::is_condition_key(key, walk.breakpoints) {
        let mut nested_when = site.when.clone();
        nested_when.push(key.into());
        let nested = EntrySite {
            when: &nested_when,
            span: site.span,
            key,
        };
        lower_call_condition(walk, value, nested);
        return;
    }
    if is_known_style_prop(key) {
        plan_call_entry(walk, key, value, site.when);
        let mut expr_walk = walk.expression_walk(key);
        lower_call_value(&mut expr_walk, value, site.when, site.span);
        return;
    }
    warn_unknown_call_key(walk, key, site.span);
}

/// Warn an unknown folded key in a style object, naming the closest canon
/// name. A JSX attribute bag owns every key outside style and condition
/// space, so it stays silent.
fn warn_unknown_call_key(walk: &mut ObjectWalk<'_>, key: &str, span: Span) {
    if matches!(walk.bag, BagSemantics::JsxAttributes) {
        return;
    }
    let help = suggest::suggestion_lines(
        suggest::suggest_property(key),
        format!("remove '{key}' or check its spelling"),
    );
    walk.warn_help(
        span,
        DiagnosticCode::UnknownProperty,
        suggest::unknown_property_message(key),
        help,
    );
}

/// Lower a folded JSX-bag `css` value as the css attribute does: an object
/// lowers its style entries, a merge-list array lowers element by element,
/// and scalars stay silent the way literal css attribute values do.
fn lower_call_css(
    walk: &mut ObjectWalk<'_>,
    value: &FenceValue,
    when: &SmallVec<[Box<str>; 2]>,
    span: Span,
) {
    match value {
        FenceValue::Object(entries) => lower_call_spread(walk, entries, when, span),
        FenceValue::Array(items) => {
            for item in items {
                lower_call_css(walk, item, when, span);
            }
        }
        FenceValue::Leaves(_) => {}
    }
}

/// Lower a folded JSX-bag `r` value as the r attribute does: an object
/// resolves its container queries, an array refuses, and scalars stay silent
/// as they do in const bags.
fn lower_call_r_attr(
    walk: &mut ObjectWalk<'_>,
    value: &FenceValue,
    when: &SmallVec<[Box<str>; 2]>,
    span: Span,
) {
    match value {
        FenceValue::Object(_) => lower_call_r(walk, value, when, span),
        FenceValue::Array(_) => warn_r_array(walk, span),
        FenceValue::Leaves(_) => {}
    }
}

/// Refuse a folded `r` array: the r attribute takes one static style object.
fn warn_r_array(walk: &mut ObjectWalk<'_>, span: Span) {
    walk.warn_help(
        span,
        DiagnosticCode::NonObjectJsxStyle,
        "JSX 'r' prop value is not a static style object (array)",
        vec!["pass a static style object to 'r' (got array)".to_string()],
    );
}

/// Lower one folded `r` object, resolving each key to a container query.
fn lower_call_r(
    walk: &mut ObjectWalk<'_>,
    value: &FenceValue,
    when: &SmallVec<[Box<str>; 2]>,
    span: Span,
) {
    let FenceValue::Object(entries) = value else {
        return;
    };
    for (raw_key, entry) in entries {
        let trimmed = raw_key.trim();
        let Some(query) =
            super::super::expressions::object::resolve_r_key(trimmed, walk.breakpoints)
        else {
            let help = suggest::suggestion_lines(
                suggest::suggest_breakpoint(trimmed, walk.breakpoints),
                "use a breakpoint from the theme".to_string(),
            );
            walk.warn_help(
                span,
                DiagnosticCode::UnknownBreakpoint,
                format!("Unknown breakpoint name in r prop: \"{trimmed}\""),
                help,
            );
            continue;
        };
        let mut nested_when = when.clone();
        nested_when.push(query.into());
        let site = EntrySite {
            when: &nested_when,
            span,
            key: trimmed,
        };
        lower_call_condition(walk, entry, site);
    }
}

/// Lower a folded condition value: objects recurse, anything else warns.
fn lower_call_condition(walk: &mut ObjectWalk<'_>, value: &FenceValue, site: EntrySite<'_>) {
    match value {
        FenceValue::Object(entries) => lower_call_spread(walk, entries, site.when, site.span),
        _ => {
            walk.warn_help(
                site.span,
                DiagnosticCode::NonObjectCondition,
                "Condition block expected object expression",
                vec![format!("give condition '{}' a style object", site.key)],
            );
        }
    }
}

/// One folded spread entry being lowered: the scope its keys nest under, its authored span, and
/// the key that names it.
struct EntrySite<'a> {
    when: &'a SmallVec<[Box<str>; 2]>,
    span: Span,
    key: &'a str,
}

/// Plan one known prop of a folded spread: one authored entry per leaf.
fn plan_call_entry(
    walk: &mut ObjectWalk<'_>,
    key: &str,
    value: &FenceValue,
    when: &SmallVec<[Box<str>; 2]>,
) {
    let Some(authored) = walk.authored.as_mut() else {
        return;
    };
    let when_strings: Vec<String> = when.iter().map(|scope| scope.to_string()).collect();
    for (planned, important) in call_values_to_json(value) {
        authored.push(crate::runtime::AuthoredDeclaration {
            when: when_strings.clone(),
            prop: key.to_string(),
            value: planned,
            important: walk.important || important,
            backing: walk.backing.clone(),
        });
    }
}

/// The single planned JSON for a folded value; multi-leaf unions and
/// partially plannable compounds plan nothing, mirroring the plan walker.
pub fn call_value_to_json(value: &FenceValue) -> Option<Value> {
    match value {
        FenceValue::Leaves(leaves) => single_leaf_json(leaves),
        FenceValue::Object(entries) => json_object(entries),
        FenceValue::Array(items) => json_array(items),
    }
}

/// The planned JSON for one leaf list: exactly one leaf plans.
fn single_leaf_json(leaves: &[AtomValue]) -> Option<Value> {
    match leaves {
        [only] => super::super::expressions::ast_value::atom_value_to_json(only),
        _ => None,
    }
}

/// The planned JSON object for folded entries, or nothing when any refuses.
fn json_object(entries: &[(Box<str>, FenceValue)]) -> Option<Value> {
    let mut map = Map::new();
    for (key, entry) in entries {
        map.insert(key.to_string(), call_value_to_json(entry)?);
    }
    Some(Value::Object(map))
}

/// The planned JSON array for folded elements, or nothing when any refuses.
fn json_array(items: &[FenceValue]) -> Option<Value> {
    let mut out = Vec::with_capacity(items.len());
    for item in items {
        out.push(call_value_to_json(item)?);
    }
    Some(Value::Array(out))
}

#[cfg(test)]
mod tests;

/// Every planned JSON leaf of a folded value for multi-valued positions:
/// leaves fan out (nulls omit), compounds plan as one, mirroring the walker.
pub fn call_values_to_json(value: &FenceValue) -> Vec<(Value, bool)> {
    match value {
        FenceValue::Leaves(leaves) => leaves
            .iter()
            .filter(|leaf| !matches!(leaf, AtomValue::Null))
            .filter_map(|leaf| {
                super::super::expressions::ast_value::atom_value_to_json(leaf)
                    .map(|json| (json, false))
            })
            .collect(),
        FenceValue::Object(_) | FenceValue::Array(_) => call_value_to_json(value)
            .map(|json| (json, false))
            .into_iter()
            .collect(),
    }
}

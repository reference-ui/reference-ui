//! CSS shorthand expansion mapping concise style props to canonical longhand atomic properties.
//! Unrolls directional abbreviations such as `padding`, `margin`, `inset`, `border`, and `outline` into individual atomic declarations.
//! Prevents cascade conflicts and specificity collisions by standardizing all declarations onto atomic longhands.

pub mod border;
pub mod dimensional;
pub mod flex;
pub mod pair;
pub mod parser;
#[cfg(test)]
mod tests;

use crate::atom::AtomValue;

fn extract_raw_val(value: &AtomValue) -> Option<&str> {
    // borderBottom: '3px solid'  /  padding: 4
    match value {
        AtomValue::String(s) => Some(s.as_ref()),
        AtomValue::Number(n) => Some(n.as_ref()),
        _ => None,
    }
}

/// True for the three canonicals whose 2–4 token values split TRBL.
pub(crate) fn is_dimensional_trbl(canon_name: &str) -> bool {
    matches!(canon_name, "padding" | "margin" | "inset")
}

/// Longhands for an already-canonical name: `find_property` plus the
/// non-empty rule, skipping `native_longhands_for_prop`'s redundant
/// re-resolve. Sound because alias resolution is single-step (no alias
/// target is itself an alias — pinned by `no_alias_chain_contract`).
pub(crate) fn longhands_for_canon(canon_name: &str) -> Option<&'static [&'static str]> {
    canon::find_property(canon_name)
        .filter(|prop| !prop.longhands.is_empty())
        .map(|prop| prop.longhands)
}

/// Expand composite, dimensional, or pair shorthand into atomic longhand declarations.
pub fn expand_shorthand(prop: &str, value: &AtomValue) -> Option<Vec<(Box<str>, AtomValue)>> {
    // borderBottom: '3px solid'  /  padding: '1r 2r'  /  borderTopRadius: '2r'
    // One canon resolve feeds every arm; each arm previously re-resolved.
    let canon_name = canon::resolve_canonical_prop(prop);
    if pair::is_radius_pair(canon_name) {
        return pair::expand_pair_with_canon(canon_name, value);
    }
    let raw_val = extract_raw_val(value)?;
    expand_scalar_shorthand(canon_name, raw_val)
}

/// Expand the flex, border, and dimensional arms off one resolved name.
fn expand_scalar_shorthand(
    canon_name: &str,
    raw_val: &str,
) -> Option<Vec<(Box<str>, AtomValue)>> {
    // flex: '1'  /  borderBottom: '3px solid'  /  padding: '1r 2r'
    if canon_name == "flex" {
        if let Some(expanded) = flex::expand_flex_value(raw_val) {
            return Some(expanded);
        }
    }
    let longhands = shared_longhands(canon_name);
    if let Some(expanded) = expand_border_arm(canon_name, longhands, raw_val) {
        return Some(expanded);
    }
    expand_dimensional_arm(canon_name, longhands, raw_val)
}

/// One shared longhands probe for the border and dimensional arms: the trio
/// pre-filter rejects provable non-members, the trbl gate keeps
/// padding/margin/inset probing.
fn shared_longhands(canon_name: &str) -> Option<&'static [&'static str]> {
    if border::maybe_border_family(canon_name) || is_dimensional_trbl(canon_name) {
        longhands_for_canon(canon_name)
    } else {
        None
    }
}

/// Border arm off the shared probe; misses fall through to dimensional.
fn expand_border_arm(
    canon_name: &str,
    longhands: Option<&[&str]>,
    raw_val: &str,
) -> Option<Vec<(Box<str>, AtomValue)>> {
    let hands = longhands?;
    if !border::is_border_family(hands) {
        return None;
    }
    border::expand_border_with_parts(canon_name, hands, raw_val)
}

/// Dimensional arm: trbl gate, 2–4 token gate, shared-probe body.
fn expand_dimensional_arm(
    canon_name: &str,
    longhands: Option<&[&str]>,
    raw_val: &str,
) -> Option<Vec<(Box<str>, AtomValue)>> {
    if !is_dimensional_trbl(canon_name) {
        return None;
    }
    let tokens = parser::split_tokens(raw_val.trim());
    if !(2..=4).contains(&tokens.len()) {
        return None;
    }
    dimensional::expand_dimensional_with_parts(canon_name, longhands, raw_val)
}

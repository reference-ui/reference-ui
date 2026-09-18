//! CSS shorthand expansion mapping concise style props to canonical longhand atomic properties.
//! Unrolls directional abbreviations such as `padding`, `margin`, `inset`, `border`, and `outline` into individual atomic declarations.
//! Prevents cascade conflicts and specificity collisions by standardizing all declarations onto atomic longhands.

pub mod border;
pub mod dimensional;
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

fn expand_dimensional(prop: &str, raw_val: &str) -> Option<Vec<(Box<str>, AtomValue)>> {
    // padding: '1r 2r'  /  margin: '1px 2px 3px 4px'  /  inset: '0 auto'
    let canon_name = canon::resolve_canonical_prop(prop);
    if !matches!(canon_name, "padding" | "margin" | "inset") {
        return None;
    }
    let tokens = parser::split_tokens(raw_val.trim());
    if !(2..=4).contains(&tokens.len()) {
        return None;
    }
    dimensional::expand_dimensional_shorthand(prop, raw_val)
}

/// Expand composite, dimensional, or pair shorthand into atomic longhand declarations.
pub fn expand_shorthand(prop: &str, value: &AtomValue) -> Option<Vec<(Box<str>, AtomValue)>> {
    // borderBottom: '3px solid'  /  padding: '1r 2r'  /  borderTopRadius: '2r'
    if let Some(expanded) = pair::expand_pair_shorthand(prop, value) {
        return Some(expanded);
    }
    let raw_val = extract_raw_val(value)?;
    border::expand_border_shorthand(prop, raw_val).or_else(|| expand_dimensional(prop, raw_val))
}

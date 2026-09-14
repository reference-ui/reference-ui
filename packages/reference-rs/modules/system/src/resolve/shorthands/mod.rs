//! CSS shorthand expansion mapping concise style props to canonical longhand atomic properties.
//! Unrolls directional abbreviations such as `padding`, `margin`, `inset`, `border`, and `outline` into individual atomic declarations.
//! Prevents cascade conflicts and specificity collisions by standardizing all declarations onto atomic longhands.

pub mod border;
pub mod dimensional;
pub mod parser;

use crate::atom::AtomValue;

/// Expand composite or dimensional shorthand into atomic longhand declarations.
pub fn expand_shorthand(
    prop: &str,
    value: &AtomValue,
) -> Option<Vec<(Box<str>, AtomValue)>> {
    let raw_val = match value {
        AtomValue::String(s) => s.as_ref(),
        AtomValue::Number(n) => n.as_ref(),
        _ => return None,
    };

    border::expand_border_shorthand(prop, raw_val)
}

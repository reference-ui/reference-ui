//! Composite border and outline shorthand decomposition pass.
//! Unrolls composite style props like `borderBottom` and `outline` into orthogonal width, style, and color longhands.
//! Strictly guards against the CSS reset-to-currentColor anomaly by never synthesizing default colors for omitted components.

use super::parser::{is_global_keyword, parse_shorthand_tokens, split_tokens, ParsedShorthand};
use crate::atom::AtomValue;

/// Closed zero-value spellings that emit a `0px` width, in gate order.
pub(crate) const ZERO_BORDER_VALUES: &[&str] = &["0", "0px", "0rem", "0em", "0%"];

/// Width the zero gate emits.
pub(crate) const ZERO_BORDER_WIDTH: &str = "0px";

/// `outline: 'none'` ring value, offset value, and offset prop.
pub(crate) const OUTLINE_NONE_VALUE: &str = "2px solid transparent";
pub(crate) const OUTLINE_NONE_OFFSET: &str = "2px";
pub(crate) const OUTLINE_OFFSET_PROP: &str = "outlineOffset";

fn is_zero_value(raw: &str) -> bool {
    // border: 0  /  border: '0px'
    ZERO_BORDER_VALUES.contains(&raw.trim())
}

fn is_whole_value(raw: &str) -> bool {
    // border: 'inherit'  /  border: 'var(--bd)'  /  border: 'borders.subtle'
    let lower = raw.trim().to_ascii_lowercase();
    is_global_keyword(&lower)
        || (lower.starts_with("var(") && lower.ends_with(')'))
        || lower.starts_with("borders.")
        || lower.starts_with("outlines.")
}

/// True only for width/style/color trios (border, outline, column/row rules).
pub(crate) fn is_border_family(longhands: &[&str]) -> bool {
    // Gate on family, not on count: flex, columns, lineClamp and friends are
    // len-3 trios of other families and must never classify as border (RS-39).
    let [width, style, color] = longhands else {
        return false;
    };
    width.ends_with("Width") && style.ends_with("Style") && color.ends_with("Color")
}

/// True only for the `outline` canonical: the sole trio with the ring step
/// and the `auto` style keyword.
pub(crate) fn is_outline_prop(canon_name: &str) -> bool {
    canon_name == "outline"
}

/// Decompose composite border or outline declaration into atomic longhands.
pub fn expand_border_shorthand(prop: &str, raw_val: &str) -> Option<Vec<(Box<str>, AtomValue)>> {
    // borderBottom: '3px solid'  →  width + style  (no color)
    let canon_name = canon::resolve_canonical_prop(prop);
    let longhands = canon::native_longhands_for_prop(canon_name)?;
    if !is_border_family(longhands) {
        return None;
    }
    let width_prop = longhands[0];
    let style_prop = longhands[1];
    let color_prop = longhands[2];
    let is_outline = is_outline_prop(canon_name);

    let trimmed = raw_val.trim();

    if is_zero_value(trimmed) {
        // border: 0  →  borderWidth: 0px
        return Some(vec![(
            width_prop.into(),
            AtomValue::String(ZERO_BORDER_WIDTH.into()),
        )]);
    }

    if trimmed == "none" && is_outline {
        // outline: 'none'  →  transparent ring plus offset, core's
        // high-contrast convention (outline.ts noneValue), never bare none.
        return Some(vec![
            (
                canon_name.into(),
                AtomValue::String(OUTLINE_NONE_VALUE.into()),
            ),
            (
                OUTLINE_OFFSET_PROP.into(),
                AtomValue::String(OUTLINE_NONE_OFFSET.into()),
            ),
        ]);
    }

    if trimmed == "none" || is_whole_value(trimmed) {
        // border: 'none'  /  outline: 'inherit'
        return Some(vec![(canon_name.into(), AtomValue::String(trimmed.into()))]);
    }

    let tokens = split_tokens(trimmed);
    if tokens.is_empty() {
        return None;
    }

    let parsed = parse_shorthand_tokens(&tokens, is_outline);
    // '3px solid red' → width / style / color longhands
    build_expanded_atoms(width_prop, style_prop, color_prop, &parsed)
}

fn build_expanded_atoms(
    width_prop: &str,
    style_prop: &str,
    color_prop: &str,
    parsed: &ParsedShorthand,
) -> Option<Vec<(Box<str>, AtomValue)>> {
    if parsed.width.is_none() && parsed.style.is_none() && parsed.color.is_none() {
        return None;
    }

    let mut out = Vec::new();
    if let Some(w) = &parsed.width {
        out.push((width_prop.into(), AtomValue::String(w.clone().into())));
    }
    if let Some(s) = &parsed.style {
        out.push((style_prop.into(), AtomValue::String(s.clone().into())));
    }
    if let Some(c) = &parsed.color {
        out.push((color_prop.into(), AtomValue::String(c.clone().into())));
    }

    Some(out)
}

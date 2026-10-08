//! Whole-value CSS classifier and per-property acceptance.
//!
//! `classify_css_value` recognizes complete CSS values — named colors, hex,
//! functions, lengths, and CSS-wide keywords — so callers can pass them
//! through without consulting the token dictionary. `prop_accepts` pairs a
//! value kind with the properties that legally carry it, from the property
//! table; harvest mints only kind-compatible pool-by-sink pairs.

use super::functions::{classify_function, FunctionKind};
use super::lengths::is_length;
use super::named_colors::is_named_color;

/// The CSS family of a recognized value.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ValueKind {
    Color,
    Length,
    Transform,
    Math,
    Url,
    Keyword,
}

/// CSS-wide keywords plus the two bare keywords the alphabet owns, sorted.
const CSS_KEYWORDS: &[&str] = &[
    "auto",
    "inherit",
    "initial",
    "none",
    "revert",
    "revert-layer",
    "unset",
];

/// Properties that legally carry length values, sorted for binary search:
/// spacing, size, inset, radius, border-width, and the length-like type props.
const LENGTH_PROPERTIES: &[&str] = &[
    "borderBlockWidth",
    "borderBottomLeftRadius",
    "borderBottomRadius",
    "borderBottomRightRadius",
    "borderBottomWidth",
    "borderEndEndRadius",
    "borderEndStartRadius",
    "borderInlineWidth",
    "borderLeftRadius",
    "borderLeftWidth",
    "borderRadius",
    "borderRightRadius",
    "borderRightWidth",
    "borderStartEndRadius",
    "borderStartStartRadius",
    "borderTopLeftRadius",
    "borderTopRadius",
    "borderTopRightRadius",
    "borderTopWidth",
    "borderWidth",
    "bottom",
    "columnGap",
    "fontSize",
    "gap",
    "height",
    "inset",
    "left",
    "letterSpacing",
    "lineHeight",
    "margin",
    "marginBlock",
    "marginBottom",
    "marginInline",
    "marginLeft",
    "marginRight",
    "marginTop",
    "maxHeight",
    "maxWidth",
    "minHeight",
    "minWidth",
    "padding",
    "paddingBlock",
    "paddingBottom",
    "paddingInline",
    "paddingLeft",
    "paddingRight",
    "paddingTop",
    "right",
    "rowGap",
    "size",
    "top",
    "width",
];

/// Properties that legally carry `url()` values, sorted for binary search.
const URL_PROPERTIES: &[&str] = &[
    "background",
    "backgroundImage",
    "listStyle",
    "listStyleImage",
    "mask",
    "maskImage",
];

/// The value kind when the whole string is complete CSS, else None.
/// Hex, functions, named colors, keywords, and lengths are disjoint shapes,
/// so order here is readability, not precedence. A value carrying `{…}`
/// token references is never complete CSS: the braces name dictionary
/// lookups the caller must expand, so the fence refuses before any table.
pub fn classify_css_value(value: &str) -> Option<ValueKind> {
    let text = value.trim();
    if text.is_empty() {
        return None;
    }
    if has_token_braces(text) {
        return None;
    }
    if is_hex_color(text) {
        return Some(ValueKind::Color);
    }
    if let Some(kind) = function_value_kind(text) {
        return Some(kind);
    }
    if is_named_color(text) {
        return Some(ValueKind::Color);
    }
    if is_css_keyword(text) {
        return Some(ValueKind::Keyword);
    }
    if is_length(text) {
        return Some(ValueKind::Length);
    }
    None
}

/// True when `prop` legally carries `kind`: colors on color props, lengths
/// and math on the length table, transforms on `transform`, urls on the
/// background/mask/list-style families, keywords everywhere (they are
/// CSS-wide by definition). Aliases canonicalize first.
pub fn prop_accepts(prop: &str, kind: ValueKind) -> bool {
    match kind {
        ValueKind::Color => super::super::is_color_prop(prop),
        ValueKind::Length | ValueKind::Math => is_length_prop(prop),
        ValueKind::Transform => canonical_prop(prop) == "transform",
        ValueKind::Url => is_url_prop(prop),
        ValueKind::Keyword => true,
    }
}

/// The value kind of a recognized function call, or None when not a call.
/// `var()` / `env()` are kind-agnostic runtime references, so they ride the
/// keyword channel and stay acceptable wherever keywords are.
fn function_value_kind(text: &str) -> Option<ValueKind> {
    match classify_function(text)? {
        FunctionKind::Color => Some(ValueKind::Color),
        FunctionKind::Math => Some(ValueKind::Math),
        FunctionKind::Transform => Some(ValueKind::Transform),
        FunctionKind::Url => Some(ValueKind::Url),
        FunctionKind::Opaque => Some(ValueKind::Keyword),
    }
}

/// True when the value carries token-reference braces, whole or embedded.
/// Either brace refuses: an unterminated `{` still names a lookup the
/// caller must diagnose, never a value the fence may pass through.
fn has_token_braces(text: &str) -> bool {
    text.contains('{') || text.contains('}')
}

/// True for `#` plus 3/4/6/8 hex digits and nothing else.
fn is_hex_color(text: &str) -> bool {
    let Some(hex) = text.strip_prefix('#') else {
        return false;
    };
    matches!(hex.len(), 3 | 4 | 6 | 8) && hex.bytes().all(|byte| byte.is_ascii_hexdigit())
}

/// True for a CSS-wide keyword, case-insensitively.
fn is_css_keyword(text: &str) -> bool {
    // Seven short entries: fold per comparison instead of lowering per call.
    // `eq_ignore_ascii_case` against lowercase entries decides exactly like
    // the old lowercase-then-search, minus the per-call `String`.
    CSS_KEYWORDS
        .iter()
        .any(|keyword| text.eq_ignore_ascii_case(keyword))
}

/// True for a canonical length-bearing property.
fn is_length_prop(prop: &str) -> bool {
    LENGTH_PROPERTIES
        .binary_search(&canonical_prop(prop))
        .is_ok()
}

/// True for a canonical url-bearing property.
fn is_url_prop(prop: &str) -> bool {
    URL_PROPERTIES.binary_search(&canonical_prop(prop)).is_ok()
}

/// The canonical property behind an alias, or the name itself.
fn canonical_prop(prop: &str) -> &str {
    crate::dialect::resolve_alias(prop).unwrap_or(prop)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tables_are_sorted_for_binary_search() {
        for table in [CSS_KEYWORDS, LENGTH_PROPERTIES, URL_PROPERTIES] {
            let mut sorted = table.to_vec();
            sorted.sort_unstable();
            assert_eq!(sorted, table);
        }
    }

    #[test]
    fn mission_alphabet_accepts() {
        use ValueKind::{Color, Keyword, Length, Math, Transform, Url};
        assert_eq!(classify_css_value("red"), Some(Color));
        assert_eq!(classify_css_value("rebeccapurple"), Some(Color));
        assert_eq!(classify_css_value("transparent"), Some(Color));
        assert_eq!(classify_css_value("#f00"), Some(Color));
        assert_eq!(classify_css_value("#ff000080"), Some(Color));
        assert_eq!(classify_css_value("rgb(0,0,0)"), Some(Color));
        assert_eq!(classify_css_value("rgba(0,0,0,0.5)"), Some(Color));
        assert_eq!(classify_css_value("hsl(0 0% 0%)"), Some(Color));
        assert_eq!(classify_css_value("hwb(0 0% 0%)"), Some(Color));
        assert_eq!(classify_css_value("lab(0% 0 0)"), Some(Color));
        assert_eq!(classify_css_value("lch(0% 0 0)"), Some(Color));
        assert_eq!(classify_css_value("oklab(0 0 0)"), Some(Color));
        assert_eq!(classify_css_value("oklch(0.7 0.1 180)"), Some(Color));
        assert_eq!(classify_css_value("color(srgb 1 0 0)"), Some(Color));
        assert_eq!(
            classify_css_value("color-mix(in srgb, red 50%, blue)"),
            Some(Color)
        );
        assert_eq!(classify_css_value("light-dark(white, black)"), Some(Color));
        assert_eq!(classify_css_value("13px"), Some(Length));
        assert_eq!(classify_css_value("1.25rem"), Some(Length));
        assert_eq!(classify_css_value("50%"), Some(Length));
        assert_eq!(classify_css_value("2vw"), Some(Length));
        assert_eq!(classify_css_value("0"), Some(Length));
        assert_eq!(classify_css_value("calc(1px + 2px)"), Some(Math));
        assert_eq!(classify_css_value("min(1px, 2px)"), Some(Math));
        assert_eq!(classify_css_value("max(1px, 2px)"), Some(Math));
        assert_eq!(classify_css_value("clamp(1px, 2vw, 3px)"), Some(Math));
        assert_eq!(classify_css_value("translateX(1.25rem)"), Some(Transform));
        assert_eq!(classify_css_value("translate(1px, 2px)"), Some(Transform));
        assert_eq!(classify_css_value("scale(2)"), Some(Transform));
        assert_eq!(classify_css_value("rotate(45deg)"), Some(Transform));
        assert_eq!(classify_css_value("url(/img.png)"), Some(Url));
        assert_eq!(classify_css_value("var(--brand)"), Some(Keyword));
        for keyword in [
            "inherit",
            "initial",
            "unset",
            "revert",
            "revert-layer",
            "none",
            "auto",
        ] {
            assert_eq!(classify_css_value(keyword), Some(Keyword), "{keyword}");
        }
    }

    #[test]
    fn keywords_match_in_any_ascii_case() {
        for keyword in [
            "AUTO",
            "None",
            "UNSET",
            "Inherit",
            "INITIAL",
            "Revert",
            "REVERT-LAYER",
        ] {
            assert_eq!(
                classify_css_value(keyword),
                Some(ValueKind::Keyword),
                "{keyword}"
            );
        }
    }

    #[test]
    fn non_values_reject() {
        for val in [
            "hello",
            "sm",
            "ui.button.mutedBackground",
            "gray.800",
            "full",
            "13r",
            "1/3r",
            "",
            "#12",
            "#12345",
            "2px solid red",
            "rgb(0,0,0",
        ] {
            assert_eq!(classify_css_value(val), None, "{val}");
        }
    }

    #[test]
    fn token_ref_values_reject() {
        for val in [
            "color-mix(in oklch, {colors.ui.table.row.muted} 80%, {colors.gray.300})",
            "color-mix(in srgb, {colors.ink} 80%, {colors.paper})",
            "0 0 0 4px color-mix(in oklch, {colors.ui.table.row.muted} 15.2%, transparent)",
            "1px solid {colors.gray.800}",
            "{colors.gray.800}",
            "rgb({colors.red.500}, 0, 0)",
            "calc(100% - {spacing.4})",
            "url({assets.logo})",
            "color-mix(in srgb, {colors.gray.800 50%, blue)",
        ] {
            assert_eq!(classify_css_value(val), None, "{val}");
        }
    }

    #[test]
    fn prop_accepts_follows_the_property_table() {
        use ValueKind::{Color, Keyword, Length, Math, Transform, Url};
        assert!(prop_accepts("color", Color));
        assert!(prop_accepts("backgroundColor", Color));
        assert!(!prop_accepts("width", Color));
        assert!(prop_accepts("marginTop", Length));
        assert!(prop_accepts("mt", Length));
        assert!(prop_accepts("width", Length));
        assert!(prop_accepts("borderTopLeftRadius", Length));
        assert!(prop_accepts("fontSize", Length));
        assert!(prop_accepts("margin", Math));
        assert!(!prop_accepts("color", Length));
        assert!(prop_accepts("transform", Transform));
        assert!(!prop_accepts("color", Transform));
        assert!(prop_accepts("backgroundImage", Url));
        assert!(!prop_accepts("color", Url));
        assert!(prop_accepts("color", Keyword));
        assert!(prop_accepts("width", Keyword));
    }
}

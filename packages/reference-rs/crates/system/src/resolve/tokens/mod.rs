//! Design token resolution and CSS custom property substitution for Reference UI.
//! Translates dot-path token references like `colors.blue.600` into corresponding `var(--...)` custom property expressions.
//! Bridges compile-time token authoring with runtime theming and stylesheet token layers.

use std::borrow::Cow;

const KNOWN_CATEGORIES: &[&str] = &[
    "colors",
    "spacing",
    "radii",
    "fonts",
    "fontSizes",
    "fontWeights",
    "lineHeights",
    "letterSpacings",
    "shadows",
    "zIndex",
    "opacity",
    "borders",
    "durations",
    "easings",
    "animations",
    "aspectRatios",
    "sizes",
    "blurs",
];

/// Returns true if the property semantically accepts color values and tokens.
pub fn is_color_prop(prop: &str) -> bool {
    matches!(
        prop,
        "color"
            | "c"
            | "background"
            | "bg"
            | "backgroundColor"
            | "bgColor"
            | "borderColor"
            | "borderC"
            | "borderTopColor"
            | "borderRightColor"
            | "borderBottomColor"
            | "borderLeftColor"
            | "borderInlineColor"
            | "borderBlockColor"
            | "borderInlineStartColor"
            | "borderInlineEndColor"
            | "borderBlockStartColor"
            | "borderBlockEndColor"
            | "outlineColor"
            | "ringColor"
            | "ring-c"
            | "accentColor"
            | "caretColor"
            | "fill"
            | "stroke"
            | "textDecorationColor"
            | "textShadowColor"
            | "boxShadowColor"
    )
}

fn is_css_color_keyword(val: &str) -> bool {
    matches!(
        val.to_ascii_lowercase().as_str(),
        "transparent"
            | "currentcolor"
            | "inherit"
            | "initial"
            | "unset"
            | "none"
            | "black"
            | "white"
    )
}

fn category_to_prefix(category: &str) -> String {
    let mut out = String::with_capacity(category.len() + 4);
    out.push_str("--");
    for ch in category.chars() {
        if ch.is_ascii_uppercase() {
            out.push('-');
            out.push(ch.to_ascii_lowercase());
        } else {
            out.push(ch);
        }
    }
    out
}

fn format_token_var(category: &str, path: &str) -> String {
    let prefix = category_to_prefix(category);
    let normalized = path.replace('.', "-");
    format!("var({prefix}-{normalized})")
}

fn format_color_mix(var_expr: &str, opacity: &str) -> String {
    let pct = if opacity.ends_with('%') {
        opacity.to_string()
    } else {
        format!("{opacity}%")
    };
    format!("color-mix(in srgb, {var_expr} {pct}, transparent)")
}

fn resolve_category_path(category: &str, path: &str) -> String {
    if category == "colors" && is_css_color_keyword(path) {
        return path.to_string();
    }

    if let Some((base, opacity)) = path.split_once('/') {
        let var_expr = format_token_var(category, base);
        format_color_mix(&var_expr, opacity)
    } else {
        format_token_var(category, path)
    }
}

fn is_potential_token_path(val: &str) -> bool {
    if val.is_empty() || val.starts_with("var(") || val.starts_with('#') {
        return false;
    }
    val.contains('.') && !val.contains(' ')
}

fn resolve_font_token(prop: &str, trimmed: &str) -> Option<String> {
    if (prop == "fontFamily" || prop == "ff") && matches!(trimmed, "sans" | "serif" | "mono") {
        Some(format!("var(--fonts-{trimmed})"))
    } else {
        None
    }
}

fn resolve_category_token(trimmed: &str) -> Option<String> {
    for category in KNOWN_CATEGORIES {
        if let Some(rest) = trimmed.strip_prefix(category) {
            if let Some(path) = rest.strip_prefix('.') {
                return Some(resolve_category_path(category, path));
            }
        }
    }
    None
}

/// Resolves a raw token value to its CSS custom property representation.
pub fn resolve_token_value<'a>(prop: &str, raw_val: &'a str) -> Cow<'a, str> {
    let trimmed = raw_val.trim();
    if trimmed.is_empty() || trimmed.starts_with("var(") {
        return Cow::Borrowed(raw_val);
    }

    let unbraced = if trimmed.starts_with('{') && trimmed.ends_with('}') && trimmed.len() >= 2 {
        &trimmed[1..trimmed.len() - 1]
    } else {
        trimmed
    };

    if let Some(font_var) = resolve_font_token(prop, unbraced) {
        return Cow::Owned(font_var);
    }

    if let Some(cat_var) = resolve_category_token(unbraced) {
        return Cow::Owned(cat_var);
    }

    if is_color_prop(prop) && is_potential_token_path(unbraced) {
        return Cow::Owned(resolve_category_path("colors", unbraced));
    }

    Cow::Borrowed(raw_val)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_category_prefixed_colors() {
        assert_eq!(
            resolve_token_value("color", "colors.blue.600"),
            "var(--colors-blue-600)"
        );
        assert_eq!(
            resolve_token_value("bg", "colors.reference.text"),
            "var(--colors-reference-text)"
        );
        assert_eq!(resolve_token_value("color", "colors.white"), "white");
        assert_eq!(
            resolve_token_value("color", "colors.transparent"),
            "transparent"
        );
    }

    #[test]
    fn test_bare_color_tokens() {
        assert_eq!(
            resolve_token_value("bg", "blue.600"),
            "var(--colors-blue-600)"
        );
        assert_eq!(
            resolve_token_value("borderColor", "gray.800"),
            "var(--colors-gray-800)"
        );
    }

    #[test]
    fn test_color_mix_opacity() {
        assert_eq!(
            resolve_token_value("bg", "colors.blue.600/50"),
            "color-mix(in srgb, var(--colors-blue-600) 50%, transparent)"
        );
        assert_eq!(
            resolve_token_value("color", "red.500/25%"),
            "color-mix(in srgb, var(--colors-red-500) 25%, transparent)"
        );
    }

    #[test]
    fn test_non_color_categories() {
        assert_eq!(
            resolve_token_value("fontFamily", "fonts.mono"),
            "var(--fonts-mono)"
        );
        assert_eq!(
            resolve_token_value("borderRadius", "radii.md"),
            "var(--radii-md)"
        );
        assert_eq!(
            resolve_token_value("fontSize", "fontSizes.xl"),
            "var(--font-sizes-xl)"
        );
    }
}

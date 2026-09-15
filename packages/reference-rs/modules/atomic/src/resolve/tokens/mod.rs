//! Design token resolution against a `BaseSystem` dictionary.
//! Turns author paths (`colors.blue.600`, `gray.800`, `{radii.md}`) into `var(--…)`
//! when the utterance declares them. Opacity `/50` becomes `color-mix` here, not in
//! base-system. Unknown dotted paths pass through as raw CSS and emit a warning.
//! Heuristic category lists are gone; lookup is the fixture.

use std::borrow::Cow;

use base_system::{BaseSystem, TokenEntry};

use crate::diagnostics::Diagnostic;

/// Returns true if the property semantically accepts color values and tokens.
pub fn is_color_prop(prop: &str) -> bool {
    canon::is_color_prop(prop)
}

/// Resolves a raw token value to its CSS custom property representation.
pub fn resolve_token_value<'a>(
    prop: &str,
    raw_val: &'a str,
    system: &BaseSystem,
    diagnostics: &mut Vec<Diagnostic>,
) -> Cow<'a, str> {
    let trimmed = raw_val.trim();
    if trimmed.is_empty() || trimmed.starts_with("var(") {
        return Cow::Borrowed(raw_val);
    }

    let unbraced = strip_braces(trimmed);
    if let Some(font_var) = resolve_font_token(prop, unbraced, system) {
        return Cow::Owned(font_var);
    }

    if is_color_prop(prop) {
        if let Some(keyword) = colors_keyword(unbraced) {
            return Cow::Owned(keyword.to_string());
        }
    }

    let (path, opacity) = split_opacity(unbraced);
    if let Some(entry) = lookup_entry(prop, path, system) {
        return Cow::Owned(format_entry(entry, opacity));
    }

    if looks_like_token_path(unbraced) {
        diagnostics.push(Diagnostic::warning(format!(
            "unknown token path `{unbraced}`"
        )));
    }

    Cow::Borrowed(raw_val)
}

fn strip_braces(trimmed: &str) -> &str {
    if trimmed.starts_with('{') && trimmed.ends_with('}') && trimmed.len() >= 2 {
        &trimmed[1..trimmed.len() - 1]
    } else {
        trimmed
    }
}

fn colors_keyword(path: &str) -> Option<&str> {
    let rest = path.strip_prefix("colors.").unwrap_or(path);
    if is_css_color_keyword(rest) {
        Some(rest)
    } else {
        None
    }
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

fn resolve_font_token(prop: &str, trimmed: &str, system: &BaseSystem) -> Option<String> {
    if (prop == "fontFamily" || prop == "ff") && system.fonts().has_family(trimmed) {
        Some(format!("var(--fonts-{trimmed})"))
    } else {
        None
    }
}

fn lookup_entry<'a>(prop: &str, path: &str, system: &'a BaseSystem) -> Option<&'a TokenEntry> {
    if let Some(entry) = system.token(path) {
        return Some(entry);
    }
    let category = token_category_for_prop(prop)?;
    system.token_in_category(category, path)
}

fn token_category_for_prop(prop: &str) -> Option<&'static str> {
    if is_color_prop(prop) {
        return Some("colors");
    }
    match prop {
        "borderRadius" | "rounded" => Some("radii"),
        "fontFamily" | "ff" => Some("fonts"),
        "animation" | "animationName" => Some("animations"),
        _ => None,
    }
}

fn split_opacity(path: &str) -> (&str, Option<&str>) {
    let Some((base, opacity)) = path.rsplit_once('/') else {
        return (path, None);
    };
    if opacity_suffix(opacity) {
        (base, Some(opacity))
    } else {
        (path, None)
    }
}

fn opacity_suffix(opacity: &str) -> bool {
    let digits = opacity.strip_suffix('%').unwrap_or(opacity);
    !digits.is_empty() && digits.chars().all(|ch| ch.is_ascii_digit())
}

fn format_entry(entry: &TokenEntry, opacity: Option<&str>) -> String {
    let var_expr = format!("var({})", entry.css_var());
    match opacity {
        Some(opacity) => format_color_mix(&var_expr, opacity),
        None => var_expr,
    }
}

fn format_color_mix(var_expr: &str, opacity: &str) -> String {
    let pct = if opacity.ends_with('%') {
        opacity.to_string()
    } else {
        format!("{opacity}%")
    };
    format!("color-mix(in srgb, {var_expr} {pct}, transparent)")
}

fn looks_like_token_path(val: &str) -> bool {
    if val.is_empty() || val.starts_with('#') || val.contains(' ') || !val.contains('.') {
        return false;
    }
    let first = val.split('.').next().unwrap_or("");
    first.chars().any(|ch| ch.is_ascii_alphabetic())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn resolve(prop: &str, raw: &str) -> String {
        let mut diagnostics = Vec::new();
        resolve_token_value(prop, raw, BaseSystem::lib_fixture(), &mut diagnostics).into_owned()
    }

    #[test]
    fn test_category_prefixed_colors() {
        assert_eq!(
            resolve("color", "colors.blue.600"),
            "var(--colors-blue-600)"
        );
        assert_eq!(
            resolve("bg", "colors.ui.field.border"),
            "var(--colors-ui-field-border)"
        );
        assert_eq!(resolve("color", "colors.white"), "white");
        assert_eq!(resolve("color", "colors.transparent"), "transparent");
    }

    #[test]
    fn test_bare_color_tokens() {
        assert_eq!(resolve("bg", "blue.600"), "var(--colors-blue-600)");
        assert_eq!(resolve("borderColor", "gray.800"), "var(--colors-gray-800)");
    }

    #[test]
    fn test_color_mix_opacity() {
        assert_eq!(
            resolve("bg", "colors.blue.600/50"),
            "color-mix(in srgb, var(--colors-blue-600) 50%, transparent)"
        );
        assert_eq!(
            resolve("color", "red.500/25%"),
            "color-mix(in srgb, var(--colors-red-500) 25%, transparent)"
        );
    }

    #[test]
    fn test_non_color_categories() {
        assert_eq!(resolve("fontFamily", "fonts.mono"), "var(--fonts-mono)");
        assert_eq!(resolve("borderRadius", "radii.md"), "var(--radii-md)");
    }

    #[test]
    fn test_css_color_keywords_passthrough() {
        assert_eq!(resolve("color", "transparent"), "transparent");
        assert_eq!(resolve("bg", "currentColor"), "currentColor");
        assert_eq!(resolve("borderColor", "black"), "black");
        assert_eq!(resolve("color", "white"), "white");
        assert_eq!(resolve("color", "inherit"), "inherit");
    }

    #[test]
    fn test_non_color_does_not_treat_bare_dots_as_colors() {
        let mut diagnostics = Vec::new();
        let css = resolve_token_value(
            "mt",
            "blue.600",
            BaseSystem::lib_fixture(),
            &mut diagnostics,
        );
        assert_eq!(css, "blue.600");
        assert_eq!(diagnostics.len(), 1);
    }

    #[test]
    fn test_bare_radii_md_resolves() {
        assert_eq!(resolve("borderRadius", "md"), "var(--radii-md)");
        assert_eq!(resolve("borderRadius", "radii.md"), "var(--radii-md)");
    }

    #[test]
    fn test_unknown_path_passthrough_warns() {
        let mut diagnostics = Vec::new();
        let css = resolve_token_value(
            "width",
            "fontSizes.xl",
            BaseSystem::lib_fixture(),
            &mut diagnostics,
        );
        assert_eq!(css, "fontSizes.xl");
        assert_eq!(diagnostics.len(), 1);
    }
}

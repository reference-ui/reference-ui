//! Lowers `BaseSystem.static_css` into wants and runtime style plans before resolve.
//!
//! This is the third want source beside JSX StyleProps and `css()`. Each property
//! maps to a token list or `['*']`. Wildcards expand across all design token categories,
//! including colors, radii, spacing, and sizes. Condition prefixes such as `_hover:color`
//! are mapped to condition scopes, and unknown properties emit diagnostic warnings.

use base_system::BaseSystem;
use smallvec::SmallVec;

use crate::atom::{AtomValue, Want};
use crate::diagnostics::Diagnostic;
use crate::runtime::AuthoredDeclaration;

const STATIC_ORIGIN: &str = "staticCss";

/// Context for lowering static CSS declarations into wants and authored style plans.
pub struct StaticCssContext<'a> {
    pub system: &'a BaseSystem,
    pub wants: &'a mut Vec<Want>,
    pub authored: &'a mut Vec<AuthoredDeclaration>,
    pub diagnostics: &'a mut Vec<Diagnostic>,
}

/// Append staticCss wants and authored declarations using the static CSS context.
pub fn append_static_css(ctx: &mut StaticCssContext<'_>) {
    for (key, values) in &ctx.system.static_css {
        let (when, prop) = parse_static_key(key);
        if !canon::is_known_style_prop(prop) {
            ctx.diagnostics.push(Diagnostic::warning(format!(
                "Unknown property in staticCss: \"{prop}\""
            )));
            continue;
        }
        if values.iter().any(|v| v == "*") {
            expand_wildcard(ctx, &when, prop);
        } else {
            for val in values {
                push_static_item(ctx, &when, prop, val);
            }
        }
    }
}

/// Backwards-compatible want-only append for tests.
#[cfg(test)]
pub fn append_wants(system: &BaseSystem, wants: &mut Vec<Want>) {
    let mut authored = Vec::new();
    let mut diagnostics = Vec::new();
    let mut ctx = StaticCssContext {
        system,
        wants,
        authored: &mut authored,
        diagnostics: &mut diagnostics,
    };
    append_static_css(&mut ctx);
}

fn parse_static_key(key: &str) -> (Vec<String>, &str) {
    let parts: Vec<&str> = key.split(':').collect();
    if parts.len() <= 1 {
        (Vec::new(), key)
    } else {
        let prop = parts.last().unwrap();
        let conditions = parts[..parts.len() - 1]
            .iter()
            .map(|s| s.to_string())
            .collect();
        (conditions, prop)
    }
}

fn expand_wildcard(ctx: &mut StaticCssContext<'_>, when: &[String], prop: &str) {
    let Some(category) = wildcard_category(prop) else {
        ctx.diagnostics.push(Diagnostic::warning(format!(
            "Cannot expand wildcard for property \"{prop}\": no associated token category"
        )));
        return;
    };
    let target_cat = resolve_system_category(ctx.system, category);
    for (key, entry) in ctx.system.tokens.iter() {
        if entry.category() == target_cat {
            let val = authored_path(key, target_cat);
            push_static_item(ctx, when, prop, val);
        }
    }
}

fn resolve_system_category<'a>(system: &'a BaseSystem, category: &'static str) -> &'static str {
    if category == "sizes" && !system.tokens.iter().any(|(_, e)| e.category() == "sizes") {
        if system.tokens.iter().any(|(_, e)| e.category() == "spacing") {
            return "spacing";
        }
    }
    category
}

fn wildcard_category(prop: &str) -> Option<&'static str> {
    let canonical = canon::resolve_canonical_prop(prop);
    if canon::is_color_prop(canonical) {
        return Some("colors");
    }
    if is_radius_property(canonical) {
        return Some("radii");
    }
    if is_spacing_property(canonical) {
        return Some("spacing");
    }
    if is_size_property(canonical) {
        return Some("sizes");
    }
    typography_or_other_category(canonical)
}

fn is_radius_property(prop: &str) -> bool {
    prop == "borderRadius" || prop.ends_with("Radius")
}

fn typography_or_other_category(prop: &str) -> Option<&'static str> {
    if prop == "boxShadow" {
        return Some("shadows");
    }
    if prop == "zIndex" {
        return Some("zIndex");
    }
    typography_category(prop)
}

fn typography_category(prop: &str) -> Option<&'static str> {
    match prop {
        "fontSize" => Some("fontSizes"),
        "fontWeight" => Some("fontWeights"),
        "lineHeight" => Some("lineHeights"),
        "letterSpacing" => Some("letterSpacings"),
        _ => None,
    }
}

fn is_spacing_property(prop: &str) -> bool {
    matches!(
        prop,
        "margin"
            | "marginTop"
            | "marginBottom"
            | "marginLeft"
            | "marginRight"
            | "marginInline"
            | "marginBlock"
            | "padding"
            | "paddingTop"
            | "paddingBottom"
            | "paddingLeft"
            | "paddingRight"
            | "paddingInline"
            | "paddingBlock"
            | "gap"
            | "rowGap"
            | "columnGap"
            | "inset"
            | "top"
            | "bottom"
            | "left"
            | "right"
    )
}

fn is_size_property(prop: &str) -> bool {
    matches!(
        prop,
        "width" | "height" | "minWidth" | "maxWidth" | "minHeight" | "maxHeight" | "size"
    )
}

fn authored_path<'a>(key: &'a str, category: &str) -> &'a str {
    key.strip_prefix(category)
        .and_then(|rest| rest.strip_prefix('.'))
        .unwrap_or(key)
}

fn push_static_item(ctx: &mut StaticCssContext<'_>, when: &[String], prop: &str, value: &str) {
    let when_boxed: SmallVec<[Box<str>; 2]> =
        when.iter().map(|w| w.clone().into_boxed_str()).collect();
    ctx.wants.push(
        Want::new(prop, AtomValue::String(value.into()))
            .with_origin(Some(STATIC_ORIGIN))
            .with_when(when_boxed),
    );
    ctx.authored.push(AuthoredDeclaration {
        when: when.to_vec(),
        prop: prop.to_string(),
        value: serde_json::Value::String(value.to_string()),
        important: false,
    });
}

#[cfg(test)]
mod tests {
    use super::*;
    use base_system::TokenLeaf;

    fn test_system() -> BaseSystem {
        let mut system = BaseSystem::default();
        for (path, light, dark) in [
            ("n100", "#f4f4f5", "#18181b"),
            ("n200", "#e4e4e7", "#27272a"),
            ("n300", "#d4d4d8", "#3f3f46"),
        ] {
            system.tokens.insert_leaf(TokenLeaf {
                category: "colors",
                path,
                light,
                dark,
            });
        }
        system.tokens.insert_leaf(TokenLeaf {
            category: "radii",
            path: "md",
            light: "0.4rem",
            dark: "0.4rem",
        });
        system
    }

    #[test]
    fn wildcard_enumerates_color_tokens() {
        let mut system = test_system();
        system.static_css.insert("color".into(), vec!["*".into()]);
        let mut wants = Vec::new();
        append_wants(&system, &mut wants);
        assert_eq!(wants.len(), 3);
        assert!(wants.iter().any(|w| w.value.class_name_str() == "n100"));
    }

    #[test]
    fn wildcard_enumerates_radii_tokens() {
        let mut system = test_system();
        system
            .static_css
            .insert("borderRadius".into(), vec!["*".into()]);
        let mut wants = Vec::new();
        append_wants(&system, &mut wants);
        assert_eq!(wants.len(), 1);
        assert_eq!(wants[0].value.class_name_str(), "md");
    }

    #[test]
    fn condition_prefixed_static_css_retains_condition() {
        let mut system = test_system();
        system
            .static_css
            .insert("_hover:color".into(), vec!["n100".into()]);
        let mut wants = Vec::new();
        let mut authored = Vec::new();
        let mut diagnostics = Vec::new();
        let mut ctx = StaticCssContext {
            system: &system,
            wants: &mut wants,
            authored: &mut authored,
            diagnostics: &mut diagnostics,
        };
        append_static_css(&mut ctx);
        assert_eq!(wants.len(), 1);
        assert_eq!(wants[0].when.as_slice(), &["_hover".into()]);
        assert_eq!(authored[0].when, vec!["_hover".to_string()]);
    }

    #[test]
    fn unknown_property_emits_diagnostic() {
        let mut system = test_system();
        system
            .static_css
            .insert("unknownProp".into(), vec!["val".into()]);
        let mut wants = Vec::new();
        let mut authored = Vec::new();
        let mut diagnostics = Vec::new();
        let mut ctx = StaticCssContext {
            system: &system,
            wants: &mut wants,
            authored: &mut authored,
            diagnostics: &mut diagnostics,
        };
        append_static_css(&mut ctx);
        assert!(wants.is_empty());
        assert_eq!(diagnostics.len(), 1);
        assert!(diagnostics[0].message.contains("unknownProp"));
    }
}

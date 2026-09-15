//! Portable design-system definition Rust consumes after TypeScript has already
//! evaluated `tokens()` / `font()` / `keyframes()` / `globalCss()` and dumped the
//! objects. This crate does not run author modules. Atomic asks whether a name is
//! a token, which wrap `_hover` uses, which font/breakpoint tables apply, and
//! which `staticCss` utilities to pre-emit. `BaseSystem::default()` is empty
//! (`BAS-DUMP-01`). `lib_fixture()` is the frozen `@reference-ui/lib` copy and
//! leaves `staticCss` empty. `from_json` fragment dumps are not implemented tonight.

mod breakpoints;
mod conditions;
mod fonts;
mod lib_fixture;
mod tokens;

use std::sync::OnceLock;

use indexmap::IndexMap;
use serde::{Deserialize, Serialize};

pub use breakpoints::BreakpointScale;
pub use fonts::{FontDefinition, FontScale};
pub use tokens::{TokenDictionary, TokenEntry, TokenLeaf};

/// Property → token names, or `["*"]` for every token in that property's category.
pub type StaticCss = IndexMap<String, Vec<String>>;

/// One package's design-system utterance: tokens, fonts, breakpoints, conditions.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BaseSystem {
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub tokens: TokenDictionary,
    #[serde(default)]
    pub fonts: FontScale,
    #[serde(default)]
    pub breakpoints: BreakpointScale,
    #[serde(default)]
    pub conditions: IndexMap<String, String>,
    #[serde(default)]
    pub global_css: Vec<String>,
    #[serde(default)]
    pub keyframes: IndexMap<String, String>,
    #[serde(default)]
    pub recipes: IndexMap<String, String>,
    #[serde(default)]
    pub static_css: StaticCss,
}

impl BaseSystem {
    /// Frozen `@reference-ui/lib` tokens, fonts, breakpoints, and host conditions.
    pub fn lib_fixture() -> &'static BaseSystem {
        static FIXTURE: OnceLock<BaseSystem> = OnceLock::new();
        FIXTURE.get_or_init(lib_fixture::build)
    }

    /// True when `path` is a declared token (`colors.gray.800`, `radii.md`).
    pub fn is_token(&self, path: &str) -> bool {
        self.token(path).is_some()
    }

    /// Token category for a declared path.
    pub fn token_category(&self, path: &str) -> Option<&str> {
        self.token(path).map(|entry| entry.category.as_str())
    }

    /// CSS custom property name (`--colors-gray-800`) for a declared path.
    pub fn token_css_var(&self, path: &str) -> Option<&str> {
        self.token(path).map(|entry| entry.css_var.as_str())
    }

    /// Light-mode CSS value for a declared path.
    pub fn token_light(&self, path: &str) -> Option<&str> {
        self.token(path).map(|entry| entry.light.as_str())
    }

    /// Dark-mode CSS value for a declared path.
    pub fn token_dark(&self, path: &str) -> Option<&str> {
        self.token(path).map(|entry| entry.dark.as_str())
    }

    /// Indexed token entry for a full `category.path` key.
    pub fn token(&self, path: &str) -> Option<&TokenEntry> {
        self.tokens.get(path)
    }

    /// Wrap string for a named `_` condition (`_hover`, `_dark`).
    pub fn get_condition(&self, key: &str) -> Option<&str> {
        if let Some(wrap) = self.conditions.get(key) {
            return Some(wrap.as_str());
        }
        if key.starts_with('_') {
            None
        } else {
            self.conditions.get(&format!("_{key}")).map(String::as_str)
        }
    }

    /// Ordered breakpoint scale, including the leading `base` slot when present.
    pub fn breakpoints(&self) -> &BreakpointScale {
        &self.breakpoints
    }

    /// Font family table (has_family, weights, css extras).
    pub fn fonts(&self) -> &FontScale {
        &self.fonts
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn assert_send_sync<T: Send + Sync>() {}

    #[test]
    fn default_definition_is_unnamed() {
        let system = BaseSystem::default();
        assert!(system.name.is_empty());
        assert!(system.tokens.is_empty());
        assert!(system.fonts.is_empty());
        assert!(system.breakpoints.is_empty());
        assert!(system.conditions.is_empty());
        assert!(system.global_css.is_empty());
        assert!(system.keyframes.is_empty());
        assert!(system.recipes.is_empty());
        assert!(system.static_css.is_empty());
        assert!(system.get_condition("_hover").is_none());
        assert!(!system.is_token("colors.gray.800"));
    }

    #[test]
    fn lib_fixture_has_lib_tokens_fonts_and_host_conditions() {
        let system = BaseSystem::lib_fixture();
        assert_eq!(system.name, "@reference-ui/lib");
        assert!(system.is_token("colors.gray.800"));
        assert_eq!(
            system.token_css_var("colors.gray.800"),
            Some("--colors-gray-800")
        );
        assert!(system
            .token_light("colors.gray.800")
            .unwrap()
            .starts_with("oklch("));
        assert!(system.is_token("colors.ui.field.border"));
        assert!(system.is_token("colors.design.background"));
        assert!(system.is_token("radii.md"));
        assert_eq!(system.token_css_var("radii.md"), Some("--radii-md"));
        assert!(system.fonts().has_family("sans"));
        assert_eq!(system.fonts().scoped_weight("sans.bold"), Some("700"));
        assert_eq!(
            system.get_condition("_hover"),
            Some("&:is(:hover, [data-hover])")
        );
        assert_eq!(
            system.get_condition("_dark"),
            Some("[data-panda-theme=dark] &")
        );
        assert_eq!(
            system.get_condition("_light"),
            Some("[data-panda-theme=light] &")
        );
        assert_ne!(system.get_condition("_dark"), Some(".dark &"));
        assert_eq!(system.breakpoints().width_px("sm"), Some("640"));
        assert!(system.static_css.is_empty());
        assert!(system
            .global_css
            .iter()
            .any(|css| css.contains("--spacing-root: 0.25rem")));
    }

    #[test]
    fn static_css_deserializes_property_lists() {
        let system: BaseSystem =
            serde_json::from_str(r#"{"staticCss":{"color":["*"],"bg":["n100","n200"]}}"#).unwrap();
        assert_eq!(system.static_css["color"], ["*"]);
        assert_eq!(system.static_css["bg"], ["n100", "n200"]);
    }

    #[test]
    fn lib_fixture_is_send_sync() {
        assert_send_sync::<BaseSystem>();
        let _ = BaseSystem::lib_fixture();
    }
}

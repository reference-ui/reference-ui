//! Portable design-system definition Rust consumes after TypeScript has already
//! evaluated `tokens()` / `font()` / `keyframes()` / `globalCss()` and serialized the
//! objects. This crate does not run author modules. Atomic asks whether a name is
//! a token, which wrap `_hover` uses, which font/breakpoint/keyframe tables apply,
//! and which `staticCss` utilities to pre-emit; recipes are static schema only.
//! `lib_fixture()` loads the generated spec through `from_json` and overlays host
//! conditions, breakpoints, and `--spacing-root`. `from_json` lowers a nested
//! `BaseSystemSpec`; `compile()` still deserializes the indexed shape directly.

mod breakpoints;
mod condition_map;
mod conditions;
mod spec;
mod fonts;
mod lib_fixture;
mod lower;
mod motion;
mod recipes;
mod tokens;

use std::sync::OnceLock;

use indexmap::IndexMap;
use serde::{Deserialize, Serialize};

pub use breakpoints::BreakpointScale;
pub use condition_map::ConditionMap;
pub use spec::FromJsonError;
pub use fonts::{FontDefinition, FontScale};
pub use motion::{AnimationKeyframeGap, KeyframeDefinition};
pub use recipes::{CompoundVariant, RecipeDefinition};
pub use tokens::{TokenDictionary, TokenEntry, TokenLeaf};

/// Property → token names, or `["*"]` for every token in that property's category.
pub type StaticCss = IndexMap<String, Vec<String>>;

/// Authored CSS declaration map (`opacity` → `0`, `p` → `4r`).
pub type StyleMap = IndexMap<String, String>;

/// One package's design-system utterance: tokens, fonts, breakpoints, conditions.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
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
    pub conditions: ConditionMap,
    #[serde(default)]
    pub global_css: Vec<String>,
    #[serde(default)]
    pub keyframes: IndexMap<String, KeyframeDefinition>,
    #[serde(default)]
    pub recipes: IndexMap<String, RecipeDefinition>,
    #[serde(default)]
    pub static_css: StaticCss,
}

impl BaseSystem {
    /// Nested evaluated spec → indexed query engine. Rejects TypeScript source and unknown keys.
    pub fn from_json(json: &str) -> Result<Self, FromJsonError> {
        lower::from_json(json)
    }

    /// Frozen `@reference-ui/lib` tokens, fonts, breakpoints, and host conditions.
    pub fn lib_fixture() -> &'static BaseSystem {
        static FIXTURE: OnceLock<BaseSystem> = OnceLock::new();
        FIXTURE.get_or_init(lib_fixture::build)
    }

    /// True when `path` is a declared full key or a unique trailing path (`n300`).
    pub fn is_token(&self, path: &str) -> bool {
        self.resolve_entry(path).is_some()
    }

    /// Token category for a full key or unique trailing path (`n300` → `colors`).
    pub fn token_category(&self, path: &str) -> Option<&str> {
        self.resolve_entry(path).map(TokenEntry::category)
    }

    /// CSS custom property name (`--colors-gray-800`) for a declared path.
    pub fn token_css_var(&self, path: &str) -> Option<&str> {
        self.resolve_entry(path).map(TokenEntry::css_var)
    }

    /// Light-mode CSS value for a declared path.
    pub fn token_light(&self, path: &str) -> Option<&str> {
        self.resolve_entry(path).map(TokenEntry::light)
    }

    /// Dark-mode override for a declared path. `None` means no override.
    pub fn token_dark(&self, path: &str) -> Option<&str> {
        self.resolve_entry(path).and_then(TokenEntry::dark)
    }

    /// Indexed token entry for a full map key (`colors.n300`, authored `md`).
    pub fn token(&self, path: &str) -> Option<&TokenEntry> {
        self.tokens.get(path)
    }

    /// Category-scoped lookup: `("colors", "n300")`, `("radii", "md")`.
    pub fn token_in_category(&self, category: &str, path: &str) -> Option<&TokenEntry> {
        self.tokens.get_in_category(category, path)
    }

    /// Unique trailing-path lookup. None when the name is missing or ambiguous.
    pub fn token_by_unique_name(&self, name: &str) -> Option<&TokenEntry> {
        self.tokens.get_unique(name)
    }

    /// Wrap string for a named condition (`_hover` or `hover`). No heap on hit.
    pub fn get_condition(&self, key: &str) -> Option<&str> {
        self.conditions.get(key)
    }

    /// Ordered breakpoint scale, including the leading `base` slot when present.
    pub fn breakpoints(&self) -> &BreakpointScale {
        &self.breakpoints
    }

    /// Font family table (has_family, weights, css extras).
    pub fn fonts(&self) -> &FontScale {
        &self.fonts
    }

    fn resolve_entry(&self, path: &str) -> Option<&TokenEntry> {
        self.token(path).or_else(|| self.token_by_unique_name(path))
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

    #[test]
    fn bas_ask_01_unique_bare_name_and_category_string() {
        let system =
            BaseSystem::from_json(r##"{"tokens":{"colors":{"n300":{"value":"#d4d4d8"}}}}"##)
                .unwrap();
        assert!(system.is_token("n300"));
        assert!(system.is_token("colors.n300"));
        assert_eq!(system.token_category("n300"), Some("colors"));
        assert!(system.token_in_category("colors", "n300").is_some());
        assert!(system.token_dark("colors.n300").is_none());
        assert!(!system.is_token("unknown"));
        assert!(system.token_category("unknown").is_none());
    }

    #[test]
    fn bas_ask_02_category_scoped_css_var_and_explicit_dark() {
        let system = BaseSystem::from_json(
            r##"{"tokens":{"colors":{"n300":{"light":"#d4d4d8","dark":"#3f3f46"}}}}"##,
        )
        .unwrap();
        let entry = system.token_in_category("colors", "n300").unwrap();
        assert_eq!(entry.css_var(), "--colors-n300");
        assert_eq!(entry.light(), "#d4d4d8");
        assert_eq!(entry.dark(), Some("#3f3f46"));
        assert_eq!(system.token_dark("colors.n300"), Some("#3f3f46"));
        assert_eq!(system.token_css_var("colors.n300"), Some("--colors-n300"));
    }

    #[test]
    fn bas_ask_06_lookups_are_send_sync_across_threads() {
        assert_send_sync::<BaseSystem>();
        let system = BaseSystem::lib_fixture();
        std::thread::scope(|scope| {
            for _ in 0..4 {
                scope.spawn(|| {
                    assert!(system.is_token("colors.gray.800"));
                    assert_eq!(
                        system.token_css_var("colors.gray.800"),
                        Some("--colors-gray-800")
                    );
                    assert_eq!(
                        system.get_condition("hover"),
                        Some("&:is(:hover, [data-hover])")
                    );
                    assert_eq!(
                        system.get_condition("_hover"),
                        Some("&:is(:hover, [data-hover])")
                    );
                    assert!(system.token_in_category("radii", "md").is_some());
                    assert!(system.is_token("md"));
                });
            }
        });
    }

    #[test]
    fn bas_dump_05_clone_shares_token_table() {
        let fixture = BaseSystem::lib_fixture();
        let cloned = fixture.clone();
        assert!(cloned.tokens.ptr_eq(&fixture.tokens));
        let again = cloned.clone();
        assert!(again.tokens.ptr_eq(&cloned.tokens));
        assert!(cloned.is_token("colors.gray.800"));
        assert!(cloned.token_in_category("radii", "md").is_some());
    }

    #[test]
    fn lib_fixture_md_resolves_as_radii() {
        let system = BaseSystem::lib_fixture();
        let entry = system.token_in_category("radii", "md").unwrap();
        assert_eq!(entry.category(), "radii");
        assert_eq!(entry.css_var(), "--radii-md");
        assert!(system.is_token("md"));
        assert!(system.token("md").is_none());
        assert!(system.token("radii.md").is_some());
    }
}

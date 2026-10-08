//! Portable design-system definition consumed after TypeScript has evaluated
//! `tokens()`, `font()`, `keyframes()`, and `globalCss()` into an `EvaluatedSystemSpec`.
//! Atomic queries whether a name is a token, which wrap `_hover` uses, which
//! font/breakpoint/keyframe tables apply, and which `staticCss` utilities to pre-emit.
//! `lib_fixture()` builds the lib fixture via public `from_spec` with `profile: "reference-ui"`.
//! `from_json` lowers a versioned `EvaluatedSystemSpec` and rejects unversioned or foreign dumps.
//! `from_specs` resolves declared `extends` graphs with downstream precedence.

mod breakpoints;
mod condition_map;
mod conditions;
mod extends;
mod fonts;
mod global_css;
mod lib_fixture;
mod lower;
mod motion;
mod recipes;
mod spec;
mod tokens;

#[cfg(test)]
mod tests;

use std::sync::OnceLock;

use indexmap::IndexMap;
use serde::{Deserialize, Serialize};

pub use breakpoints::BreakpointScale;
pub use condition_map::ConditionMap;
pub use fonts::{FontDefinition, FontFaceDefinition, FontScale};
pub use global_css::{GlobalCssFragment, GlobalDeclarationValue, GlobalStyleNode};
pub use motion::{AnimationKeyframeGap, KeyframeDefinition};
pub use recipes::{CompoundVariant, RecipeDefinition};
pub use spec::{
    BaseSystemSpec, EvaluatedSystemSpec, FromJsonError, ProvenanceEntry, ProvenanceKind,
    SpecBreakpointWidth,
};
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
    pub global_css: Vec<GlobalCssFragment>,
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

    /// Lower a typed EvaluatedSystemSpec into an indexed BaseSystem.
    pub fn from_spec(spec: &EvaluatedSystemSpec) -> Result<Self, FromJsonError> {
        lower::from_spec(spec)
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

    /// True when the token belongs to an internal `_private` tree.
    pub fn is_token_private(&self, path: &str) -> bool {
        self.token(path).is_some_and(TokenEntry::is_private)
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

    /// Borrowed slice of ordered global CSS fragments.
    pub fn global_css(&self) -> &[GlobalCssFragment] {
        &self.global_css
    }

    fn resolve_entry(&self, path: &str) -> Option<&TokenEntry> {
        self.token(path).or_else(|| self.token_by_unique_name(path))
    }
}

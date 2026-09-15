//! Frozen `@reference-ui/lib` BaseSystem constructor.
//! Copies tokens, fonts, breakpoints, named conditions, and `:root --spacing-root`
//! from the lib theme files. Does not evaluate TypeScript, parse TSX, or load
//! fragments at runtime. Keyframes, recipes, and `staticCss` stay empty; stations
//! pass a custom dump when they need pre-emitted utilities.

use crate::breakpoints::BreakpointScale;
use crate::conditions::lib_conditions;
use crate::fonts::lib_fonts;
use crate::tokens;
use crate::BaseSystem;

const SPACING_ROOT: &str = ":root { --spacing-root: 0.25rem }";

/// Build the owned lib fixture. `BaseSystem::lib_fixture` caches the result.
pub fn build() -> BaseSystem {
    let fonts = lib_fonts();
    let mut tokens = Default::default();
    tokens::fill_lib(&mut tokens, &fonts);
    BaseSystem {
        name: "@reference-ui/lib".to_string(),
        tokens,
        fonts,
        breakpoints: BreakpointScale::standard(),
        conditions: lib_conditions(),
        global_css: vec![SPACING_ROOT.to_string()],
        keyframes: Default::default(),
        recipes: Default::default(),
        static_css: Default::default(),
    }
}

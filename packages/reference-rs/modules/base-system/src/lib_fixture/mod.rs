//! Frozen `@reference-ui/lib` BaseSystem constructor.
//! Loads the committed nested spec (`lib.json`) through `from_json`, then overlays
//! host pieces lib does not author: Panda-preset conditions, `BreakpointScale::standard()`,
//! and the single `:root { --spacing-root: 0.25rem }` globalCss line. The spec is
//! generated from lib theme object literals; this crate does no runtime file I/O.

use crate::breakpoints::BreakpointScale;
use crate::conditions::lib_conditions;
use crate::BaseSystem;

const SPACING_ROOT: &str = ":root { --spacing-root: 0.25rem }";
const LIB_SPEC: &str = include_str!("lib.json");

/// Build the owned lib fixture. `BaseSystem::lib_fixture` caches the result.
pub fn build() -> BaseSystem {
    let mut system = BaseSystem::from_json(LIB_SPEC).unwrap_or_else(|err| panic!("{err}"));
    system.breakpoints = BreakpointScale::standard();
    system.conditions = lib_conditions().into();
    system.global_css = vec![SPACING_ROOT.to_string()];
    system
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn lib_fixture_matches_generated_spec_keys_and_len() {
        let from_spec = BaseSystem::from_json(LIB_SPEC).unwrap_or_else(|err| panic!("{err}"));
        let fixture = BaseSystem::lib_fixture();
        assert!(fixture.is_token("colors.gray.800"));
        assert!(fixture.is_token("colors.design.text.light"));
        assert!(fixture.is_token("colors.ui.list.definition.description.foreground"));
        assert!(fixture.is_token("radii.md"));
        assert!(fixture.fonts().has_family("sans"));
        assert!(fixture.is_token("colors.reference.text"));
        assert_eq!(fixture.tokens.len(), from_spec.tokens.len());
        assert_eq!(fixture.tokens, from_spec.tokens);
        assert_eq!(fixture.fonts, from_spec.fonts);
        assert_eq!(fixture.keyframes, from_spec.keyframes);
        assert_eq!(fixture.keyframes.len(), 31);
        assert!(fixture.is_token("animations.fadeIn.normal"));
        assert!(fixture.animation_keyframe_gaps().is_empty());
        assert!(fixture.recipes.is_empty());
    }
}

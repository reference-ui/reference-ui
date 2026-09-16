//! Frozen `@reference-ui/lib` BaseSystem constructor for explicit Rust tests.
//! Loads the committed fragment spec (`lib.json`) into a versioned `EvaluatedSystemSpec`
//! with `profile: "reference-ui"`, lowering canonical conditions, standard breakpoints,
//! and the structured `--spacing-root` global rule through the public `from_spec` path.
//! This fixture is strictly opt-in for testing; production compilation refuses missing specs.

use indexmap::IndexMap;
use serde::Deserialize;

use crate::global_css::{GlobalCssFragment, GlobalDeclarationValue};
use crate::spec::{EvaluatedSystemSpec, ProvenanceEntry, ProvenanceKind, TokenSpecNode};
use crate::{BaseSystem, FontDefinition, KeyframeDefinition};

const LIB_SPEC: &str = include_str!("lib.json");

#[derive(Deserialize)]
struct LibJsonDump {
    name: String,
    tokens: IndexMap<String, TokenSpecNode>,
    fonts: IndexMap<String, FontDefinition>,
    keyframes: IndexMap<String, KeyframeDefinition>,
}

/// Build the owned lib fixture through the public lowering path.
pub fn build() -> BaseSystem {
    let dump: LibJsonDump = serde_json::from_str(LIB_SPEC).unwrap_or_else(|err| panic!("{err}"));
    let mut root_rule = IndexMap::new();
    root_rule.insert(
        "--spacing-root".to_string(),
        GlobalDeclarationValue::String("0.25rem".to_string()),
    );
    root_rule.insert(
        "containerType".to_string(),
        GlobalDeclarationValue::String("inline-size".to_string()),
    );
    let mut rules = IndexMap::new();
    rules.insert(":root".to_string(), root_rule);
    let global_css = vec![GlobalCssFragment {
        source: "packages/reference-lib/src/theme/global.ts".to_string(),
        rules,
    }];
    let spec = EvaluatedSystemSpec {
        schema_version: 1,
        profile: "reference-ui".to_string(),
        name: dump.name,
        tokens: dump.tokens,
        fonts: dump.fonts,
        breakpoints: None,
        conditions: None,
        global_css,
        keyframes: dump.keyframes,
        recipes: IndexMap::new(),
        static_css: IndexMap::new(),
        provenance: vec![ProvenanceEntry {
            source: "packages/reference-lib".to_string(),
            kind: ProvenanceKind::Fragment,
            keys: Vec::new(),
        }],
    };
    BaseSystem::from_spec(&spec)
        .unwrap_or_else(|err| panic!("lib_fixture lowering failed: {err}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn lib_fixture_matches_generated_spec_keys_and_len() {
        let fixture = BaseSystem::lib_fixture();
        assert!(fixture.is_token("colors.gray.800"));
        assert!(fixture.is_token("colors.design.text.light"));
        assert!(fixture.is_token("colors.ui.list.definition.description.foreground"));
        assert!(fixture.is_token("radii.md"));
        assert!(fixture.fonts().has_family("sans"));
        assert!(fixture.is_token("colors.reference.text"));
        assert_eq!(fixture.keyframes.len(), 31);
        assert!(fixture.is_token("animations.fadeIn.normal"));
        assert!(fixture.animation_keyframe_gaps().is_empty());
        assert!(fixture.recipes.is_empty());
        assert_eq!(fixture.global_css.len(), 1);
        assert_eq!(fixture.breakpoints().width_px("sm"), Some("640"));
        assert_eq!(fixture.get_condition("_dark"), Some("[data-theme=dark] &"));
    }
}

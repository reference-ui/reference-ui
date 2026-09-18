//! Unit tests for system layer generation, token selectors, reset layer, and font faces.
//! Verifies cascade layer ordering, dark theme selectors, and keyframe omission.

use super::*;
use base_system::{FontFaceDefinition, TokenDictionary, TokenLeaf};

fn custom_system() -> BaseSystem {
    let mut tokens = TokenDictionary::default();
    tokens.insert_leaf(TokenLeaf {
        category: "colors",
        path: "brand",
        light: "red",
        dark: "navy",
    });
    tokens.insert_leaf(TokenLeaf {
        category: "colors",
        path: "alias",
        light: "{colors.brand}",
        dark: "{colors.brand}",
    });
    let mut root_rule = indexmap::IndexMap::new();
    root_rule.insert(
        "--spacing-root".to_string(),
        base_system::GlobalDeclarationValue::String("0.25rem".to_string()),
    );
    let mut rules = indexmap::IndexMap::new();
    rules.insert(":root".to_string(), root_rule);
    let global_css = vec![base_system::GlobalCssFragment {
        source: "test".to_string(),
        rules,
    }];
    BaseSystem {
        name: "custom".into(),
        tokens,
        global_css,
        ..Default::default()
    }
}

fn emit(system: &BaseSystem) -> String {
    let mut out = String::new();
    let mut diagnostics = Vec::new();
    append_system_layers(&mut out, system, &mut diagnostics);
    out
}

#[test]
fn empty_system_prints_no_layers() {
    assert_eq!(emit(&BaseSystem::default()), "");
}

#[test]
fn fixture_prints_spacing_root_and_token_vars() {
    let css = emit(BaseSystem::lib_fixture());
    assert!(css.contains("@layer global {"));
    assert!(css.contains("--spacing-root: 0.25rem"));
    assert!(css.contains("@keyframes fadeIn"));
    assert!(css.contains("@keyframes spin"));
    assert!(css.contains("from { opacity: 0; }"));
    assert!(css.contains("to { opacity: 1; }"));
    assert!(css.contains("@layer tokens {"));
    assert!(css.contains(":root, [data-color-mode=light] {"));
    assert!(css.contains("--colors-blue-600:"));
    assert!(css.contains("[data-color-mode=dark]"));
    assert!(!css.contains("@layer reset {"));
    assert!(!css.contains("@layer recipes {"));
}

#[test]
fn bas_motion_02_fixture_emits_fade_in_and_spin_keyframes() {
    let css = emit(BaseSystem::lib_fixture());
    assert!(css.contains("@keyframes fadeIn"));
    assert!(css.contains("@keyframes spin"));
    assert!(css.contains("from { transform: rotate(0deg); }"));
    assert!(css.contains("to { transform: rotate(360deg); }"));
}

#[test]
fn custom_dump_prints_only_declared_tokens() {
    let css = emit(&custom_system());
    assert!(css.contains("--colors-brand: red;"));
    assert!(css.contains("[data-color-mode=dark] {"));
    assert!(css.contains("--colors-brand: navy;"));
    assert!(css.contains("--colors-alias: var(--colors-brand);"));
    assert!(!css.contains("--colors-blue-600"));
    assert!(!css.contains("@keyframes"));
    assert!(!css.contains("fadeIn"));
}

#[test]
fn empty_keyframe_definition_does_not_print_at_rule() {
    let mut system = BaseSystem::default();
    system
        .keyframes
        .insert("ghost".into(), KeyframeDefinition::default());
    assert_eq!(emit(&system), "");
}

#[test]
fn camel_case_keyframe_props_emit_kebab() {
    let system = BaseSystem::from_json(
        r#"{"schemaVersion":1,"profile":"reference-ui","name":"test","tokens":{},"fonts":{},"globalCss":[],"keyframes":{"shimmer":{"0%":{"backgroundPosition":"-200% 0"},"100%":{"backgroundPosition":"200% 0"}}},"recipes":{},"staticCss":{},"provenance":[]}"#,
    )
    .unwrap();
    let css = emit(&system);
    assert!(css.contains("@keyframes shimmer"));
    assert!(css.contains("background-position: -200% 0;"));
    assert!(!css.contains("backgroundPosition"));
}

#[test]
fn keyframe_bodies_resolve_token_refs_and_rhythm() {
    let system = BaseSystem::from_json(
        r##"{"schemaVersion":1,"profile":"reference-ui","name":"test","tokens":{"colors":{"brand":{"value":"#ff0000"}}},"fonts":{},"globalCss":[],"keyframes":{"grow":{"from":{"backgroundColor":"{colors.brand}","width":"1r"},"to":{"backgroundColor":"{colors.brand}","width":"4r"}}},"recipes":{},"staticCss":{},"provenance":[]}"##,
    )
    .unwrap();
    let css = emit(&system);
    assert!(css.contains("@keyframes grow"));
    assert!(css.contains("background-color: var(--colors-brand);"));
    assert!(css.contains("width: var(--spacing-root);"));
    assert!(css.contains("width: calc(4 * var(--spacing-root));"));
    assert!(!css.contains("{colors.brand}"));
}

#[test]
fn keyframe_alias_props_lower_like_css() {
    let system = BaseSystem::from_json(
        r#"{"schemaVersion":1,"profile":"reference-ui","name":"test","tokens":{"sizes":{"4":{"value":"1rem"}}},"fonts":{},"globalCss":[],"keyframes":{"roll":{"from":{"h":"4"},"to":{"h":"8"}}},"recipes":{},"staticCss":{},"provenance":[]}"#,
    )
    .unwrap();
    let css = emit(&system);
    assert!(css.contains("@keyframes roll"));
    assert!(css.contains("height: var(--sizes-4);"));
    assert!(css.contains("height: 8px;"));
    assert!(!css.contains(" h:"));
}

#[test]
fn keyframe_unresolvable_values_print_verbatim() {
    let system = BaseSystem::from_json(
        r#"{"schemaVersion":1,"profile":"reference-ui","name":"test","tokens":{},"fonts":{},"globalCss":[],"keyframes":{"drift":{"from":{"backgroundColor":"{colors.ghost}","transform":"scale(0.3)"}}},"recipes":{},"staticCss":{},"provenance":[]}"#,
    )
    .unwrap();
    let css = emit(&system);
    assert!(css.contains("background-color: {colors.ghost};"));
    assert!(css.contains("transform: scale(0.3);"));
}

#[test]
fn font_face_prints_in_layer_global() {
    let mut fonts = indexmap::IndexMap::new();
    fonts.insert(
        "sans".to_string(),
        base_system::FontDefinition {
            value: "Inter, sans-serif".to_string(),
            weights: indexmap::IndexMap::new(),
            css: indexmap::IndexMap::new(),
            font_face: Some(vec![FontFaceDefinition {
                src: "url(/fonts/inter.woff2)".to_string(),
                font_weight: Some("400 700".to_string()),
                font_display: Some("swap".to_string()),
                font_style: None,
                size_adjust: Some("104%".to_string()),
                descent_override: Some("47%".to_string()),
            }]),
        },
    );
    let system = BaseSystem {
        fonts: base_system::FontScale::from_definitions(fonts),
        ..Default::default()
    };
    let css = emit(&system);
    assert!(css.contains("@layer global {"));
    assert!(css.contains("@font-face {"));
    assert!(css.contains("font-family: Inter;"));
    assert!(css.contains("src: url(/fonts/inter.woff2);"));
    assert!(css.contains("font-display: swap;"));
    assert!(css.contains("font-weight: 400 700;"));
    assert!(css.contains("size-adjust: 104%;"));
    assert!(css.contains("descent-override: 47%;"));
}

#[test]
fn font_face_array_prints_one_block_per_entry() {
    let mut fonts = indexmap::IndexMap::new();
    fonts.insert(
        "sans".to_string(),
        base_system::FontDefinition {
            value: "Inter, sans-serif".to_string(),
            weights: indexmap::IndexMap::new(),
            css: indexmap::IndexMap::new(),
            font_face: Some(vec![
                FontFaceDefinition {
                    src: "url(/fonts/inter-normal.woff2)".to_string(),
                    font_style: Some("normal".to_string()),
                    ..Default::default()
                },
                FontFaceDefinition {
                    src: "url(/fonts/inter-italic.woff2)".to_string(),
                    font_style: Some("italic".to_string()),
                    ..Default::default()
                },
            ]),
        },
    );
    let system = BaseSystem {
        fonts: base_system::FontScale::from_definitions(fonts),
        ..Default::default()
    };
    let css = emit(&system);
    assert_eq!(css.matches("@font-face {").count(), 2);
    assert!(css.contains("src: url(/fonts/inter-normal.woff2);"));
    assert!(css.contains("src: url(/fonts/inter-italic.woff2);"));
    assert!(css.contains("font-style: normal;"));
    assert!(css.contains("font-style: italic;"));
}

#[test]
fn reset_fragment_prints_in_layer_reset() {
    let mut rules = indexmap::IndexMap::new();
    let mut star_rule = indexmap::IndexMap::new();
    star_rule.insert(
        "boxSizing".to_string(),
        base_system::GlobalDeclarationValue::String("border-box".to_string()),
    );
    rules.insert("*".to_string(), star_rule);
    let system = BaseSystem {
        global_css: vec![base_system::GlobalCssFragment {
            source: "preflight.ts".to_string(),
            rules,
        }],
        ..Default::default()
    };
    let css = emit(&system);
    assert!(css.contains("@layer reset {"));
    assert!(css.contains("* { box-sizing: border-box }"));
}

//! Integration tests for BaseSystem query contracts, lib fixture, and global CSS.
//! Verifies thread-safe Send + Sync lookups, token resolution, category scoping,
//! condition wrap retrieval with data-theme, and structured global CSS rule blocks.

use super::*;

fn assert_send_sync<T: Send + Sync>() {}

fn test_envelope(tokens: &str) -> String {
    format!(
        r#"{{"schemaVersion":1,"profile":"reference-ui","name":"test","tokens":{tokens},"fonts":{{}},"globalCss":[],"keyframes":{{}},"recipes":{{}},"staticCss":{{}},"provenance":[]}}"#
    )
}

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
        Some("[data-theme=dark] &")
    );
    assert_eq!(
        system.get_condition("_light"),
        Some("[data-theme=light] &")
    );
    assert_ne!(system.get_condition("_dark"), Some(".dark &"));
    assert_eq!(system.breakpoints().width_px("sm"), Some("640"));
    assert!(system.static_css.is_empty());
    assert_eq!(system.global_css().len(), 1);
    let root = system.global_css()[0].rules.get(":root").unwrap();
    assert_eq!(
        root.get("--spacing-root"),
        Some(&GlobalDeclarationValue::String("0.25rem".into()))
    );
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
    let json = test_envelope(r##"{"colors":{"n300":{"value":"#d4d4d8"}}}"##);
    let system = BaseSystem::from_json(&json).unwrap();
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
    let json = test_envelope(r##"{"colors":{"n300":{"light":"#d4d4d8","dark":"#3f3f46"}}}"##);
    let system = BaseSystem::from_json(&json).unwrap();
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

#[test]
fn bas_global_01_stores_structured_global_rules() {
    let json = r#"{
        "schemaVersion": 1,
        "profile": "reference-ui",
        "name": "test",
        "tokens": {},
        "fonts": {},
        "globalCss": [
            {
                "source": "src/theme/global.ts",
                "rules": {
                    ":root": { "--spacing-root": "0.25rem" },
                    "body": { "margin": 0 }
                }
            }
        ],
        "keyframes": {},
        "recipes": {},
        "staticCss": {},
        "provenance": []
    }"#;
    let system = BaseSystem::from_json(json).unwrap();
    assert_eq!(system.global_css().len(), 1);
    let rules = &system.global_css()[0].rules;
    assert_eq!(
        rules[":root"].get("--spacing-root"),
        Some(&GlobalDeclarationValue::String("0.25rem".into()))
    );
    assert_eq!(
        rules["body"].get("margin"),
        Some(&GlobalDeclarationValue::Number(0.into()))
    );
}

#[test]
fn bas_global_02_stores_responsive_breakpoints() {
    let json = r#"{
        "schemaVersion": 1,
        "profile": "reference-ui",
        "name": "test",
        "tokens": {},
        "fonts": {},
        "breakpoints": {
            "sm": "640px",
            "md": "768px",
            "lg": "1024px"
        },
        "globalCss": [],
        "keyframes": {},
        "recipes": {},
        "staticCss": {},
        "provenance": []
    }"#;
    let system = BaseSystem::from_json(json).unwrap();
    assert_eq!(system.breakpoints().breakpoint_for_index(0), Some("base"));
    assert_eq!(system.breakpoints().breakpoint_for_index(1), Some("sm"));
    assert_eq!(system.breakpoints().breakpoint_for_index(2), Some("md"));
    assert_eq!(system.breakpoints().breakpoint_for_index(3), Some("lg"));
    assert_eq!(system.breakpoints().width_px("sm"), Some("640"));
}

#[test]
fn bas_global_03_indexes_conditions() {
    let json = r#"{
        "schemaVersion": 1,
        "profile": "reference-ui",
        "name": "test",
        "tokens": {},
        "fonts": {},
        "conditions": {
            "_hover": "&:hover",
            "_dark": "[data-theme=\"dark\"] &",
            "_focusVisible": "&:focus-visible"
        },
        "globalCss": [],
        "keyframes": {},
        "recipes": {},
        "staticCss": {},
        "provenance": []
    }"#;
    let system = BaseSystem::from_json(json).unwrap();
    assert_eq!(system.get_condition("_hover"), Some("&:hover"));
    assert_eq!(system.get_condition("_dark"), Some("[data-theme=\"dark\"] &"));
    assert_eq!(system.get_condition("_focusVisible"), Some("&:focus-visible"));
}

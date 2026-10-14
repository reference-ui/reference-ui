//! Spec module unit tests for EvaluatedSystemSpec, versions, and wire invariants.
//! Asserts positive lowering of root frozen fixtures, rejection of unsupported
//! schema versions, invalid leaf shapes, unknown top-level fields, and foreign core dumps.

use super::*;
use crate::BaseSystem;

const FOREIGN: &str =
    r#"{"name":"@reference-ui/lib","fragment":"(function(){})()","jsxElements":["Button"]}"#;

const FROZEN_FIXTURE: &str = include_str!("../../../contracts/fixtures/evaluated-system-spec.json");

fn test_envelope(tokens_json: &str) -> String {
    format!(
        r#"{{"schemaVersion":1,"profile":"reference-ui","name":"@reference-ui/lib","tokens":{tokens_json},"fonts":{{}},"globalCss":[],"keyframes":{{}},"recipes":{{}},"staticCss":{{}},"provenance":[]}}"#
    )
}

fn owned_envelope(owned_json: &str) -> String {
    format!(
        r#"{{"schemaVersion":1,"profile":"reference-ui","name":"@reference-ui/lib","tokens":{{}},"fonts":{{}},"globalCss":[],"keyframes":{{}},"recipes":{{}},"staticCss":{{}},"provenance":[],"jsxOwned":{owned_json}}}"#
    )
}

#[test]
fn bas_dump_02_indexes_nested_color_leaf() {
    let json = test_envelope(r##"{"colors":{"blue":{"600":{"value":"#2563eb"}}}}"##);
    let system = BaseSystem::from_json(&json).unwrap();
    assert!(system.is_token("colors.blue.600"));
    assert_eq!(system.token_category("colors.blue.600"), Some("colors"));
    assert_eq!(
        system.token_css_var("colors.blue.600"),
        Some("--colors-blue-600")
    );
    assert_eq!(system.token_light("colors.blue.600"), Some("#2563eb"));
    assert!(system.token_dark("colors.blue.600").is_none());
}

#[test]
fn bas_dump_03_preserves_system_name() {
    let json = test_envelope("{}");
    let system = BaseSystem::from_json(&json).unwrap();
    assert_eq!(system.name, "@reference-ui/lib");
}

#[test]
fn bas_dump_04_rejects_typescript_source() {
    let err = BaseSystem::from_json("tokens({ colors: { primary: '#fff' } })").unwrap_err();
    let message = err.to_string();
    assert!(
        message.contains("evaluated JSON"),
        "unexpected parse diagnostic: {message}"
    );
}

#[test]
fn atm_token_10_rejects_foreign_core_shape() {
    let spec_err = BaseSystem::from_json(FOREIGN).unwrap_err();
    let spec_message = spec_err.to_string();
    assert!(
        spec_message.contains("unknown field"),
        "unexpected spec diagnostic: {spec_message}"
    );
}

#[test]
fn absent_version_rejects() {
    assert!(BaseSystem::from_json("{}").is_err());
}

#[test]
fn unsupported_schema_version_rejects() {
    let v0 = r#"{"schemaVersion":0,"profile":"reference-ui","name":"test","tokens":{},"fonts":{},"globalCss":[],"keyframes":{},"recipes":{},"staticCss":{},"provenance":[]}"#;
    let v2 = r#"{"schemaVersion":2,"profile":"reference-ui","name":"test","tokens":{},"fonts":{},"globalCss":[],"keyframes":{},"recipes":{},"staticCss":{},"provenance":[]}"#;
    assert!(matches!(
        BaseSystem::from_json(v0).unwrap_err(),
        FromJsonError::UnsupportedSchemaVersion(0)
    ));
    assert!(matches!(
        BaseSystem::from_json(v2).unwrap_err(),
        FromJsonError::UnsupportedSchemaVersion(2)
    ));
}

#[test]
fn unsupported_profile_rejects() {
    let custom = r#"{"schemaVersion":1,"profile":"custom-profile","name":"test","tokens":{},"fonts":{},"globalCss":[],"keyframes":{},"recipes":{},"staticCss":{},"provenance":[]}"#;
    assert!(matches!(
        BaseSystem::from_json(custom).unwrap_err(),
        FromJsonError::UnsupportedProfile(p) if p == "custom-profile"
    ));
}

#[test]
fn frozen_fixture_lowers_successfully() {
    let system = BaseSystem::from_json(FROZEN_FIXTURE).unwrap();
    assert_eq!(system.name, "lib-test-system");
    assert!(system.is_token("colors.blue.500"));
    assert!(system.is_token("colors.bg.canvas"));
    assert!(system.is_token("spacing.4"));
    assert_eq!(system.token_light("spacing.4"), Some("1rem"));
    assert!(system.fonts().has_family("sans"));
    assert_eq!(system.breakpoints().width_px("sm"), Some("640"));
    assert_eq!(system.breakpoints().width_px("md"), Some("768"));
    assert_eq!(system.get_condition("_hover"), Some("&:hover"));
    assert_eq!(
        system.get_condition("_dark"),
        Some("[data-color-mode=dark] &")
    );
    assert_eq!(
        system.get_condition("_light"),
        Some("[data-color-mode=light] &")
    );
    assert_eq!(system.global_css().len(), 1);
    assert!(system.keyframes.contains_key("spin"));
    assert!(system.get_recipe("button").is_some());
}

#[test]
fn light_named_nested_group_is_not_a_mode_slot() {
    let json = test_envelope(
        r#"{"colors":{"design":{"text":{"light":{"light":"{colors.gray.700}","dark":"{colors.gray.300}"}}}}}"#,
    );
    let system = BaseSystem::from_json(&json).unwrap();
    assert!(system.is_token("colors.design.text.light"));
    assert!(!system.is_token("colors.design.text"));
    assert_eq!(
        system.token_light("colors.design.text.light"),
        Some("{colors.gray.700}")
    );
    assert_eq!(
        system.token_dark("colors.design.text.light"),
        Some("{colors.gray.300}")
    );
}

#[test]
fn open_category_indexes_arbitrary_token() {
    let json = test_envelope(r#"{"foo":{"bar":{"value":"1"}}}"#);
    let system = BaseSystem::from_json(&json).unwrap();
    assert!(system.is_token("foo.bar"));
    assert_eq!(system.token_category("foo.bar"), Some("foo"));
    assert_eq!(system.token_css_var("foo.bar"), Some("--foo-bar"));
    assert_eq!(system.token_light("foo.bar"), Some("1"));
}

#[test]
fn string_leaf_is_invalid() {
    let json = test_envelope(r##"{"colors":{"blue":{"500":"#3b82f6"}}}"##);
    let err = BaseSystem::from_json(&json).unwrap_err();
    assert!(matches!(
        err,
        FromJsonError::InvalidLeaf { path, .. } if path == "colors.blue.500"
    ));
}

#[test]
fn spec_with_jsx_owned_lowers_onto_the_base_system() {
    let json = owned_envelope(r#"{"CodeIcon":["size","variant"],"Tile":["tone"]}"#);
    let system = BaseSystem::from_json(&json).unwrap();
    assert_eq!(system.jsx_owned.len(), 2);
    assert_eq!(
        system.jsx_owned.get("CodeIcon"),
        Some(&vec!["size".to_string(), "variant".to_string()])
    );
    assert_eq!(
        system.jsx_owned.get("Tile"),
        Some(&vec!["tone".to_string()])
    );
}

#[test]
fn spec_without_jsx_owned_owns_nothing() {
    let system = BaseSystem::from_json(&test_envelope("{}")).unwrap();
    assert!(system.jsx_owned.is_empty());
    assert!(BaseSystem::default().jsx_owned.is_empty());
}

#[test]
fn jsx_owned_key_is_omitted_from_the_wire_when_empty() {
    let bare = BaseSystem::from_json(&test_envelope("{}")).unwrap();
    let bare_wire = serde_json::to_value(&bare).unwrap();
    assert!(bare_wire.get("jsxOwned").is_none(), "{bare_wire}");

    let owned = BaseSystem::from_json(&owned_envelope(r#"{"CodeIcon":["size"]}"#)).unwrap();
    let owned_wire = serde_json::to_value(&owned).unwrap();
    assert_eq!(
        owned_wire.get("jsxOwned"),
        Some(&serde_json::json!({"CodeIcon": ["size"]}))
    );
    // The indexed shape round-trips, so a pre-lowered system keeps its roster.
    let again: BaseSystem = serde_json::from_value(owned_wire).unwrap();
    assert_eq!(again.jsx_owned, owned.jsx_owned);
}

#[test]
fn jsx_owned_must_map_names_to_string_arrays() {
    let json = owned_envelope(r#"{"CodeIcon":"size"}"#);
    assert!(matches!(
        BaseSystem::from_json(&json).unwrap_err(),
        FromJsonError::Parse(_)
    ));
}

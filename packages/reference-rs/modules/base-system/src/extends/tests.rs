//! Extends core tests: upstream token adoption, downstream precedence, `_private`
//! stripping, recipe and font merge, multi-level chains, and fail-closed cycle,
//! unknown-system, and envelope diagnostics via `BaseSystem::from_specs`.

use indexmap::IndexMap;

use super::parts::*;
use crate::spec::FromJsonError;
use crate::BaseSystem;

#[test]
fn bas_extend_01_merges_upstream_tokens() {
    let mut systems = IndexMap::new();
    insert_spec(
        &mut systems,
        Parts {
            tokens: r##"{"colors":{"n100":{"value":"#eee"}}}"##,
            ..parts("a")
        },
    );
    insert_spec(
        &mut systems,
        Parts {
            extends: &["a"],
            tokens: r##"{"colors":{"n200":{"value":"#ccc"}}}"##,
            ..parts("b")
        },
    );
    let merged = resolve("b", &systems);
    assert_eq!(merged.name, "b");
    assert!(merged.is_token("colors.n100"));
    assert!(merged.is_token("colors.n200"));
    assert_eq!(merged.token_category("n100"), Some("colors"));
    assert_eq!(merged.token_category("n200"), Some("colors"));
    assert_eq!(merged.token_light("colors.n100"), Some("#eee"));
    assert_eq!(merged.token_css_var("colors.n100"), Some("--colors-n100"));
}

#[test]
fn bas_extend_02_downstream_override_wins_without_collision() {
    let mut systems = IndexMap::new();
    insert_spec(
        &mut systems,
        Parts {
            tokens: r##"{"colors":{"primary":{"value":"#0066cc"}}}"##,
            ..parts("a")
        },
    );
    insert_spec(
        &mut systems,
        Parts {
            extends: &["a"],
            tokens: r##"{"colors":{"primary":{"value":"#0055bb"}}}"##,
            ..parts("b")
        },
    );
    let merged = resolve("b", &systems);
    assert_eq!(merged.token_light("colors.primary"), Some("#0055bb"));
    assert!(merged.token_dark("colors.primary").is_none());
}

#[test]
fn bas_extend_03_strips_private_across_boundary() {
    let mut systems = IndexMap::new();
    insert_spec(
        &mut systems,
        Parts {
            tokens: r##"{"colors":{"publicToken":{"value":"#111"},"_private":{"secretAccent":{"value":"#999"}}}}"##,
            ..parts("a")
        },
    );
    insert_spec(
        &mut systems,
        Parts {
            extends: &["a"],
            tokens: r##"{"colors":{"local":{"value":"#222"},"_private":{"ownSecret":{"value":"#333"}}}}"##,
            ..parts("b")
        },
    );
    let merged = resolve("b", &systems);
    assert!(merged.is_token("colors.publicToken"));
    assert!(!merged.is_token("colors._private.secretAccent"));
    assert!(merged.token("colors._private.secretAccent").is_none());
    assert!(merged.is_token("colors.local"));
    assert!(merged.is_token("colors._private.ownSecret"));
    assert!(merged.is_token_private("colors._private.ownSecret"));
    let upstream = resolve("a", &systems);
    assert!(upstream.is_token("colors._private.secretAccent"));
}

#[test]
fn top_level_private_category_stripped_across_boundary() {
    let mut systems = IndexMap::new();
    insert_spec(
        &mut systems,
        Parts {
            tokens: r##"{"colors":{"publicToken":{"value":"#111"}},"_private":{"secret":{"value":"#999"}}}"##,
            ..parts("a")
        },
    );
    insert_spec(
        &mut systems,
        Parts {
            extends: &["a"],
            tokens: r##"{"colors":{"local":{"value":"#222"}}}"##,
            ..parts("b")
        },
    );
    let merged = resolve("b", &systems);
    assert!(merged.is_token("colors.publicToken"));
    assert!(merged.is_token("colors.local"));
    assert!(!merged.is_token("_private.secret"));
    assert!(merged.token("_private.secret").is_none());
    let upstream = resolve("a", &systems);
    assert!(upstream.is_token("_private.secret"));
}

#[test]
fn bas_extend_04_merges_recipes_and_fonts() {
    let mut systems = IndexMap::new();
    insert_spec(
        &mut systems,
        Parts {
            fonts: r##"{"sans":{"value":"\"Inter\", sans-serif"}}"##,
            recipes: r##"{"badge":{"base":{"p":"2r"},"variants":{"tone":{"quiet":{"bg":"n100"}}},"defaultVariants":{"tone":"quiet"}}}"##,
            ..parts("a")
        },
    );
    insert_spec(
        &mut systems,
        Parts {
            extends: &["a"],
            fonts: r##"{"sans":{"value":"\"Local\", sans-serif"}}"##,
            recipes: r##"{"button":{"base":{"p":"4r"}}}"##,
            ..parts("b")
        },
    );
    let merged = resolve("b", &systems);
    assert!(merged.get_recipe("badge").is_some());
    assert!(merged.get_recipe("button").is_some());
    assert_eq!(
        merged
            .get_recipe("badge")
            .unwrap()
            .base
            .get("p")
            .map(String::as_str),
        Some("2r")
    );
    assert!(merged.fonts().has_family("sans"));
    assert_eq!(
        merged.token_light("fonts.sans"),
        Some("\"Local\", sans-serif")
    );
}

#[test]
fn bas_extend_05_chain_precedence_and_private_stripped_at_each_boundary() {
    let mut systems = IndexMap::new();
    insert_spec(
        &mut systems,
        Parts {
            tokens: r##"{"colors":{"shared":{"value":"A"},"fromA":{"value":"A"},"_private":{"aSecret":{"value":"sA"}}}}"##,
            ..parts("a")
        },
    );
    insert_spec(
        &mut systems,
        Parts {
            extends: &["a"],
            tokens: r##"{"colors":{"shared":{"value":"B"},"fromB":{"value":"B"},"_private":{"bSecret":{"value":"sB"}}}}"##,
            ..parts("b")
        },
    );
    insert_spec(
        &mut systems,
        Parts {
            extends: &["b"],
            tokens: r##"{"colors":{"shared":{"value":"C"}}}"##,
            ..parts("c")
        },
    );
    let merged = resolve("c", &systems);
    assert_eq!(merged.token_light("colors.shared"), Some("C"));
    assert_eq!(merged.token_light("colors.fromB"), Some("B"));
    assert_eq!(merged.token_light("colors.fromA"), Some("A"));
    assert!(!merged.is_token("colors._private.aSecret"));
    assert!(!merged.is_token("colors._private.bSecret"));
    let middle = resolve("b", &systems);
    assert_eq!(middle.token_light("colors.shared"), Some("B"));
    assert!(middle.is_token("colors._private.bSecret"));
    assert!(!middle.is_token("colors._private.aSecret"));
}

#[test]
fn bas_extend_05_cycle_and_unknown_fail_closed() {
    let mut systems = IndexMap::new();
    insert_spec(
        &mut systems,
        Parts {
            extends: &["b"],
            ..parts("a")
        },
    );
    insert_spec(
        &mut systems,
        Parts {
            extends: &["a"],
            ..parts("b")
        },
    );
    let err = BaseSystem::from_specs("a", &systems).unwrap_err();
    assert!(matches!(err, FromJsonError::ExtendsCycle { .. }));
    assert_eq!(err.to_string(), "extends cycle detected: a -> b -> a");
    let mut looping = IndexMap::new();
    insert_spec(
        &mut looping,
        Parts {
            extends: &["c"],
            ..parts("c")
        },
    );
    let self_err = BaseSystem::from_specs("c", &looping).unwrap_err();
    assert_eq!(self_err.to_string(), "extends cycle detected: c -> c");
    let mut missing = IndexMap::new();
    insert_spec(
        &mut missing,
        Parts {
            extends: &["ghost"],
            ..parts("d")
        },
    );
    let unknown = BaseSystem::from_specs("d", &missing).unwrap_err();
    assert!(matches!(
        unknown,
        FromJsonError::UnknownUpstream { ref name } if name == "ghost"
    ));
    assert_eq!(
        BaseSystem::from_specs("nope", &missing).unwrap_err(),
        FromJsonError::UnknownUpstream {
            name: "nope".to_string()
        }
    );
}

#[test]
fn bas_extend_foreign_upstream_envelope_rejected() {
    let bad_version = r##"{"schemaVersion":2,"profile":"reference-ui","name":"a","extends":[],"tokens":{},"fonts":{},"globalCss":[],"keyframes":{},"recipes":{},"staticCss":{},"provenance":[]}"##;
    let root = r##"{"schemaVersion":1,"profile":"reference-ui","name":"b","extends":["a"],"tokens":{},"fonts":{},"globalCss":[],"keyframes":{},"recipes":{},"staticCss":{},"provenance":[]}"##;
    let mut systems = IndexMap::new();
    systems.insert(
        "a".to_string(),
        crate::spec::EvaluatedSystemSpec::from_json(bad_version).unwrap(),
    );
    systems.insert(
        "b".to_string(),
        crate::spec::EvaluatedSystemSpec::from_json(root).unwrap(),
    );
    assert!(matches!(
        BaseSystem::from_specs("b", &systems).unwrap_err(),
        FromJsonError::UnsupportedSchemaVersion(2)
    ));
    let bad_profile = r##"{"schemaVersion":1,"profile":"custom","name":"a","extends":[],"tokens":{},"fonts":{},"globalCss":[],"keyframes":{},"recipes":{},"staticCss":{},"provenance":[]}"##;
    systems.insert(
        "a".to_string(),
        crate::spec::EvaluatedSystemSpec::from_json(bad_profile).unwrap(),
    );
    assert!(matches!(
        BaseSystem::from_specs("b", &systems).unwrap_err(),
        FromJsonError::UnsupportedProfile(profile) if profile == "custom"
    ));
}

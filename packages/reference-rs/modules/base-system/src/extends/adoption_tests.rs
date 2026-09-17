//! Extends adoption tests: light/dark modes, keyframes, conditions, breakpoints,
//! static CSS, and the `fonts` dual-source namespace across the extends boundary.
//! Also pins the upstream global CSS exclusion, diamond sharing, later-upstream
//! precedence, and standalone equivalence with direct lowering.

use indexmap::IndexMap;

use super::parts::*;
use crate::BaseSystem;

#[test]
fn bas_global_04_upstream_global_css_not_reinjected() {
    let mut systems = IndexMap::new();
    insert_spec(
        &mut systems,
        Parts {
            global_css: r##"[{"source":"a/theme.ts","rules":{"body":{"margin":0}}}]"##,
            ..parts("a")
        },
    );
    insert_spec(
        &mut systems,
        Parts {
            extends: &["a"],
            global_css: r##"[{"source":"b/theme.ts","rules":{".app":{"color":"red"}}}]"##,
            ..parts("b")
        },
    );
    let merged = resolve("b", &systems);
    assert_eq!(merged.global_css().len(), 1);
    assert_eq!(merged.global_css()[0].source, "b/theme.ts");
    assert!(merged.global_css()[0].rules.contains_key(".app"));
}

#[test]
fn bas_extend_modes_keyframes_conditions_breakpoints_adopted() {
    let mut systems = IndexMap::new();
    insert_spec(
        &mut systems,
        Parts {
            tokens: r##"{"colors":{"text":{"light":"#111111","dark":"#f5f5f5"}},"animations":{"spin":{"value":"spin 1s linear infinite"}}}"##,
            keyframes: r##"{"spin":{"from":{"opacity":"0"},"to":{"opacity":"1"}}}"##,
            conditions: Some(r##"{"_brand":".brand &"}"##),
            breakpoints: Some(r##"{"md":"800px"}"##),
            ..parts("a")
        },
    );
    insert_spec(
        &mut systems,
        Parts {
            extends: &["a"],
            conditions: Some(r##"{"_hover":"&:hover"}"##),
            ..parts("b")
        },
    );
    let merged = resolve("b", &systems);
    assert_eq!(merged.token_light("colors.text"), Some("#111111"));
    assert_eq!(merged.token_dark("colors.text"), Some("#f5f5f5"));
    assert!(merged.keyframes.contains_key("spin"));
    assert!(merged.animation_keyframe_gaps().is_empty());
    assert_eq!(merged.get_condition("_brand"), Some(".brand &"));
    assert_eq!(merged.get_condition("_hover"), Some("&:hover"));
    assert_eq!(merged.get_condition("hover"), Some("&:hover"));
    assert_eq!(merged.breakpoints().width_px("md"), Some("800"));
    assert_eq!(merged.breakpoints().width_px("sm"), Some("640"));
}

#[test]
fn bas_extend_diamond_shares_upstream_without_cycle() {
    let mut systems = IndexMap::new();
    insert_spec(
        &mut systems,
        Parts {
            tokens: r##"{"colors":{"shared":{"value":"D"}}}"##,
            ..parts("d")
        },
    );
    insert_spec(
        &mut systems,
        Parts {
            extends: &["d"],
            tokens: r##"{"colors":{"fromA":{"value":"A"}}}"##,
            ..parts("a")
        },
    );
    insert_spec(
        &mut systems,
        Parts {
            extends: &["d"],
            tokens: r##"{"colors":{"fromB":{"value":"B"}}}"##,
            ..parts("b")
        },
    );
    insert_spec(
        &mut systems,
        Parts {
            extends: &["a", "b"],
            ..parts("c")
        },
    );
    let merged = resolve("c", &systems);
    assert_eq!(merged.token_light("colors.shared"), Some("D"));
    assert!(merged.is_token("colors.fromA"));
    assert!(merged.is_token("colors.fromB"));
}

#[test]
fn bas_extend_later_upstream_wins_and_static_css_replaces() {
    let mut systems = IndexMap::new();
    insert_spec(
        &mut systems,
        Parts {
            tokens: r##"{"colors":{"shared":{"value":"A"}}}"##,
            static_css: r##"{"color":["n100"]}"##,
            ..parts("a")
        },
    );
    insert_spec(
        &mut systems,
        Parts {
            tokens: r##"{"colors":{"shared":{"value":"B"}}}"##,
            static_css: r##"{"color":["n200"],"bg":["n100"]}"##,
            ..parts("b")
        },
    );
    insert_spec(
        &mut systems,
        Parts {
            extends: &["a", "b"],
            ..parts("c")
        },
    );
    let merged = resolve("c", &systems);
    assert_eq!(merged.token_light("colors.shared"), Some("B"));
    assert_eq!(merged.static_css["color"], ["n200"]);
    assert_eq!(merged.static_css["bg"], ["n100"]);
}

#[test]
fn bas_extend_fonts_token_dual_source_downstream_wins() {
    let mut systems = IndexMap::new();
    insert_spec(
        &mut systems,
        Parts {
            tokens: r##"{"fonts":{"sans":{"value":"UPSTREAM-TOKEN"}}}"##,
            ..parts("a")
        },
    );
    insert_spec(
        &mut systems,
        Parts {
            extends: &["a"],
            fonts: r##"{"sans":{"value":"Local Family"}}"##,
            ..parts("b")
        },
    );
    let merged = resolve("b", &systems);
    assert!(merged.fonts().has_family("sans"));
    assert_eq!(merged.token_light("fonts.sans"), Some("Local Family"));
    let mut flipped = IndexMap::new();
    insert_spec(
        &mut flipped,
        Parts {
            fonts: r##"{"serif":{"value":"Upstream Serif"}}"##,
            ..parts("a")
        },
    );
    insert_spec(
        &mut flipped,
        Parts {
            extends: &["a"],
            tokens: r##"{"fonts":{"serif":{"value":"RAW-TOKEN"}}}"##,
            ..parts("b")
        },
    );
    let merged = resolve("b", &flipped);
    assert!(!merged.fonts().has_family("serif"));
    assert_eq!(merged.token_light("fonts.serif"), Some("RAW-TOKEN"));
}

#[test]
fn bas_extend_standalone_matches_direct_lowering() {
    let mut systems = IndexMap::new();
    let rich = Parts {
        tokens: r##"{"colors":{"text":{"light":"#111","dark":"#eee"}}}"##,
        fonts: r##"{"sans":{"value":"Inter, sans-serif"}}"##,
        keyframes: r##"{"spin":{"from":{"opacity":"0"}}}"##,
        recipes: r##"{"button":{"base":{"p":"4r"}}}"##,
        global_css: r##"[{"source":"a/theme.ts","rules":{".app":{"color":"red"}}}]"##,
        conditions: Some(r##"{"_brand":".brand &"}"##),
        breakpoints: Some(r##"{"md":"800px"}"##),
        static_css: r##"{"color":["*"]}"##,
        ..parts("a")
    };
    let (name, spec) = load(rich);
    let direct = BaseSystem::from_spec(&spec).unwrap();
    systems.insert(name, spec);
    assert_eq!(BaseSystem::from_specs("a", &systems).unwrap(), direct);
}

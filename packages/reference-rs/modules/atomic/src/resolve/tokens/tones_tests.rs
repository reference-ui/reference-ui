//! Unit tests for the tones module: role routing, suffix shape, lookup order,
//! and the value-shape usability gate (percentages, references, cycles). The
//! end-to-end gate — bare values and brace interpolation — is pinned through
//! `resolve_token_value` in `tests.rs`; here each piece is asserted directly.

use base_system::{BaseSystem, TokenLeaf};

use super::tones::{self, ToneRole};

fn tone_system() -> BaseSystem {
    let mut system = BaseSystem::default();
    system.tokens.insert_leaf(TokenLeaf {
        category: "tones",
        path: "medium.surface",
        light: "10%",
        dark: "10%",
    });
    system.tokens.insert_leaf(TokenLeaf {
        category: "tones",
        path: "medium.line",
        light: "34%",
        dark: "34%",
    });
    system.tokens.insert_leaf(TokenLeaf {
        category: "tones",
        path: "hush",
        light: "6%",
        dark: "6%",
    });
    system.tokens.insert_leaf(TokenLeaf {
        category: "tones",
        path: "solo.surface",
        light: "12.5%",
        dark: "12.5%",
    });
    system
}

#[test]
fn role_routes_surface_and_line_families() {
    for (prop, role) in [
        ("backgroundColor", ToneRole::Surface),
        ("bg", ToneRole::Surface),
        ("fill", ToneRole::Surface),
        ("--brand", ToneRole::Surface),
        ("borderColor", ToneRole::Line),
        ("border", ToneRole::Line),
        ("outline", ToneRole::Line),
        ("color", ToneRole::Line),
        ("boxShadow", ToneRole::Line),
        ("webkitTextFillColor", ToneRole::Line),
        ("msScrollbarTrackColor", ToneRole::Surface),
        ("mozAppearance", ToneRole::Surface),
    ] {
        assert_eq!(tones::role_for_prop(prop), role, "{prop}");
    }
}

#[test]
fn suffix_must_be_an_identifier_over_a_colour_base() {
    assert_eq!(
        tones::split_tone_reference("blue.500/medium"),
        Some(("blue.500", "medium"))
    );
    assert_eq!(
        tones::split_tone_reference("blue.500/x-y_1"),
        Some(("blue.500", "x-y_1"))
    );
    for rejected in [
        "blue.500/10",
        "blue.500/",
        "/medium",
        "-blue.500/medium",
        "white/medium",
        "transparent/medium",
        "colors.white/medium",
    ] {
        assert_eq!(tones::split_tone_reference(rejected), None, "{rejected}");
    }
}

#[test]
fn lookup_prefers_specific_then_flat_then_surface() {
    let system = tone_system();
    assert_eq!(
        tones::lookup(&system, "medium", ToneRole::Surface)
            .unwrap()
            .css_var(),
        "--tones-medium-surface"
    );
    assert_eq!(
        tones::lookup(&system, "medium", ToneRole::Line)
            .unwrap()
            .css_var(),
        "--tones-medium-line"
    );
    for role in [ToneRole::Surface, ToneRole::Line] {
        assert_eq!(
            tones::lookup(&system, "hush", role).unwrap().css_var(),
            "--tones-hush",
            "flat leaf serves every role"
        );
    }
    assert_eq!(
        tones::lookup(&system, "solo", ToneRole::Line)
            .unwrap()
            .css_var(),
        "--tones-solo-surface",
        "a surface-only tone still serves line"
    );
    assert!(tones::lookup(&system, "ghost", ToneRole::Surface).is_none());
}

fn reference_system() -> BaseSystem {
    let mut system = tone_system();
    system.tokens.insert_leaf(TokenLeaf {
        category: "colors",
        path: "blue.500",
        light: "#2563eb",
        dark: "#2563eb",
    });
    system.tokens.insert_leaf(TokenLeaf {
        category: "tones",
        path: "ref",
        light: "{tones.hush}",
        dark: "{tones.hush}",
    });
    system.tokens.insert_leaf(TokenLeaf {
        category: "tones",
        path: "arc",
        light: "0.1",
        dark: "0.1",
    });
    system.tokens.insert_leaf(TokenLeaf {
        category: "tones",
        path: "loop",
        light: "{tones.loopA}",
        dark: "{tones.loopA}",
    });
    system.tokens.insert_leaf(TokenLeaf {
        category: "tones",
        path: "loopA",
        light: "{tones.loop}",
        dark: "{tones.loop}",
    });
    system
}

#[test]
fn resolve_emits_mix_for_usable_tones_only() {
    let system = reference_system();
    let blue = system.token("colors.blue.500").unwrap();
    assert_eq!(
        tones::resolve(&system, "bg", blue, "medium").as_deref(),
        Some("color-mix(in srgb, var(--colors-blue-500) var(--tones-medium-surface), transparent)")
    );
    assert_eq!(
        tones::resolve(&system, "borderColor", blue, "medium").as_deref(),
        Some("color-mix(in srgb, var(--colors-blue-500) var(--tones-medium-line), transparent)")
    );
    assert!(
        tones::resolve(&system, "bg", blue, "ref").is_some(),
        "a whole tone reference is usable"
    );
    assert!(
        tones::resolve(&system, "bg", blue, "arc").is_none(),
        "a fraction amount is unusable"
    );
    assert!(
        tones::resolve(&system, "bg", blue, "loop").is_none(),
        "a reference cycle fails closed"
    );
}

#[test]
fn tone_names_are_the_first_segment_after_tones() {
    let system = reference_system();
    assert_eq!(
        tones::tone_names(&system),
        vec!["medium", "hush", "solo", "ref", "arc", "loop", "loopA"]
    );
    assert_eq!(tones::nearest(&system, "mediun"), Some("medium"));
    assert_eq!(tones::nearest(&system, "zzzzzz"), None);
}

#[test]
fn a_declared_tone_name_is_never_suggested() {
    let system = reference_system();
    assert_eq!(
        tones::nearest(&system, "arc"),
        None,
        "`ref` is three edits away and must not win"
    );
    assert_eq!(tones::nearest(&system, "medium"), None);
}

//! Lowering proofs for named `_` conditions, breakpoints, at-rules, and `&` selectors.
//! Pins catalog wraps (`_file`, `_placeholder` twins), breakpoint container
//! queries, `@supports`/`@container` passthrough, and unknown-key refusal with
//! its resolve-time diagnostic. Sits beside `mod.rs` so that file stays under
//! the line budget, mirroring the cascade tests.

use super::*;
use crate::atom::{AtomSet, AtomValue, Want, WhenKind};
use crate::diagnostics::DiagnosticLocation;
use crate::resolve::{resolve_want_with, ResolveSession};
use crate::stylesheet;
use smallvec::smallvec;

fn known(raw: &str, system: &BaseSystem) -> When {
    match lower_when(raw, system) {
        LoweredWhen::Known(when) => when,
        other => panic!("expected known condition for {raw}, got {other:?}"),
    }
}

fn assert_selector(raw: &str, expected: &str, system: &BaseSystem) {
    match known(raw, system).wrap() {
        WhenKind::Selector(s) => assert_eq!(s, expected),
        other => panic!("expected selector for {raw}, got {other:?}"),
    }
}

fn assert_container(raw: &str, px: &str, system: &BaseSystem) {
    match known(raw, system).wrap() {
        WhenKind::Container(m) => {
            assert_eq!(m, format!("@container (min-width: {px}px)"))
        }
        other => panic!("expected container query for {raw}, got {other:?}"),
    }
}

#[test]
fn test_lower_named_segments() {
    let empty = BaseSystem::default();
    assert!(matches!(lower_when("base", &empty), LoweredWhen::Skip));
    let hover = known("_hover", &empty);
    assert_eq!(hover.class_segment(), "hover");
    assert_eq!(hover.authored(), "_hover");
    assert!(matches!(lower_when("sm", &empty), LoweredWhen::Unknown));
    let sm = known("sm", BaseSystem::lib_fixture());
    assert_eq!(sm.class_segment(), "sm");
    let slot = known("&[data-slot=inner]", &empty);
    assert_eq!(slot.class_segment(), "[&[data-slot=inner]]");
}

#[test]
fn test_lower_presets() {
    let system = BaseSystem::lib_fixture();
    assert_selector("_file", "&::file-selector-button", system);
    assert_selector(
        "_placeholder",
        "&::placeholder, &[data-placeholder]",
        system,
    );
    assert_selector("_hover", "&:is(:hover, [data-hover])", system);
    assert_selector("_dark", "[data-color-mode=dark] &", system);
    assert_selector(
        "_groupHover",
        "&:is(:where(.group, [data-group]):is(:hover, [data-hover]) *)",
        system,
    );
    assert_selector(
        "_peerFocus",
        "&:is(:where(.peer, [data-peer]):is(:focus, [data-focus]) ~ *)",
        system,
    );
}

#[test]
fn test_named_breakpoint_lowers_to_container() {
    let system = BaseSystem::lib_fixture();
    assert_container("sm", "640", system);
    assert_container("md", "768", system);
    assert_container("lg", "1024", system);
    assert_container("xl", "1280", system);
    assert_container("2xl", "1536", system);
}

#[test]
fn test_parent_selector_keys_lower_to_raw_template() {
    let system = BaseSystem::lib_fixture();
    assert_selector("input:hover &", "input:hover &", system);
    assert_selector(":focus > &", ":focus > &", system);
    let slot = known("input:hover &", system);
    assert_eq!(slot.class_segment(), "[input:hover_&]");
}

#[test]
fn test_supports_lowers_to_at_rule() {
    let when = known("@supports (display: grid)", &BaseSystem::default());
    assert_eq!(when.class_segment(), "[@supports_(display:_grid)]");
    match when.wrap() {
        WhenKind::Supports(query) => assert_eq!(query, "@supports (display: grid)"),
        other => panic!("expected supports wrap, got {other:?}"),
    }
}

#[test]
fn test_container_passthrough() {
    match known("@container (min-width: 640px)", &BaseSystem::default()).wrap() {
        WhenKind::Container(m) => {
            assert_eq!(m, "@container (min-width: 640px)")
        }
        _ => panic!("expected container query"),
    }
}

#[test]
fn bare_query_rules_are_refused() {
    let empty = BaseSystem::default();
    for bare in ["@supports", "@media", "@container", "@supports "] {
        assert!(
            matches!(lower_when(bare, &empty), LoweredWhen::Unknown),
            "bare `{bare}` must refuse, not wrap"
        );
    }
    assert!(matches!(
        lower_when("@supports (display: grid)", &empty),
        LoweredWhen::Known(_)
    ));
    assert!(is_bare_query_rule("@media"));
    assert!(!is_bare_query_rule("@media (min-width: 640px)"));
    assert!(!is_bare_query_rule("@keyframes spin"));
}

#[test]
fn unknown_underscore_is_refused() {
    assert!(matches!(
        lower_when("_nope", BaseSystem::lib_fixture()),
        LoweredWhen::Unknown
    ));
    assert!(matches!(
        lower_when("_hovr", BaseSystem::lib_fixture()),
        LoweredWhen::Unknown
    ));
}

#[test]
fn unknown_condition_drops_atom_with_diagnostic() {
    let want = Want::new("color", AtomValue::String("red".into()))
        .with_when(smallvec!["_nope".into()]);
    let mut diagnostics = Vec::new();
    let system = BaseSystem::lib_fixture();
    let mut session = ResolveSession {
        system: &system,
        diagnostics: &mut diagnostics,
        location: DiagnosticLocation::default(),
    };
    let atoms = resolve_want_with(&want, &mut session);
    assert!(atoms.is_empty());
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(diagnostics[0].message, "Unknown condition \"_nope\"");
}

#[test]
fn unknown_condition_keeps_sibling_and_does_not_wrap_nope() {
    let nope = Want::new("color", AtomValue::String("red".into()))
        .with_when(smallvec!["_nope".into()]);
    let sibling = Want::new("color", AtomValue::String("red".into()));
    let mut diagnostics = Vec::new();
    let system = BaseSystem::lib_fixture();
    let mut session = ResolveSession {
        system: &system,
        diagnostics: &mut diagnostics,
        location: DiagnosticLocation::default(),
    };
    let mut atoms = resolve_want_with(&nope, &mut session);
    atoms.extend(resolve_want_with(&sibling, &mut session));
    assert_eq!(atoms.len(), 1);
    assert!(atoms[0].conditions().is_empty());
    assert_eq!(atoms[0].value.class_name_str(), "red");
    let css = stylesheet::build_stylesheet(
        &atoms.into_iter().collect::<AtomSet>(),
        &system,
        &mut Vec::new(),
    );
    assert!(css.contains(".\\@reference-ui\\/lib__c_red { color: red; }"));
    assert!(!css.contains(":nope"));
    assert!(!css.contains("nope:"));
}

#[test]
fn test_media_ranges_share_container_bounds() {
    let system = BaseSystem::lib_fixture();
    assert_eq!(
        breakpoint_media_query("sm", system).as_deref(),
        Some("@media (min-width: 640px)")
    );
    assert_eq!(
        breakpoint_media_query("smOnly", system).as_deref(),
        Some("@media (min-width: 640px) and (max-width: 767.98px)")
    );
    assert_eq!(
        breakpoint_media_query("mdDown", system).as_deref(),
        Some("@media (max-width: 767.98px)")
    );
    assert_eq!(
        breakpoint_media_query("smToLg", system).as_deref(),
        Some("@media (min-width: 640px) and (max-width: 1023.98px)")
    );
    assert_eq!(breakpoint_media_query("base", system), None);
    assert_eq!(breakpoint_media_query("nope", system), None);
}

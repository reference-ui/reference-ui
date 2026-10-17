//! Pins the proof join for local styles: an absent expected key replaces its legacy line, a present
//! one drops it, and causeless or duplicate misses warn once per key. Fixtures hand-build expected
//! keys, plans, and rejections so each test checks one join rule.

use super::*;
use crate::diagnostics::{
    adapters::resolve::ResolveReport, DeclarationDetail, DiagnosticCode, DiagnosticLocation,
    NameDetail, ResolveDetail, ResolveOutcome, SourceId, SourceSite, StyleSurfaceKind, ValueDetail,
};
use oxc_span::Span;

fn site() -> SourceSite {
    SourceSite {
        source: SourceId(0),
        span: Span::new(0, 4),
        surface: StyleSurfaceKind::Css,
        prop: "color".into(),
        when: Vec::new(),
    }
}

fn key(prop: &str, value: serde_json::Value) -> OwnedLookupKey {
    OwnedLookupKey {
        system: "lib".into(),
        when: Vec::new(),
        prop: prop.into(),
        value,
        important: false,
    }
}

fn located() -> DiagnosticLocation {
    DiagnosticLocation {
        file: Some("t.ts".to_string()),
        line: Some(4),
        column: Some(19),
        span: None,
    }
}

fn plan(prop: &str, value: serde_json::Value) -> RuntimeStylePlan {
    RuntimeStylePlan {
        system: "lib".to_string(),
        when: Vec::new(),
        prop: prop.to_string(),
        value,
        important: false,
        declarations: Vec::new(),
    }
}

fn condition_reject(key: OwnedLookupKey) -> (DiagnosticFact, Diagnostic) {
    let report = ResolveReport {
        location: located(),
        key: Some(key),
        outcome: ResolveOutcome::Rejected {
            code: DiagnosticCode::UnknownCondition,
            detail: ResolveDetail::Declaration(DeclarationDetail::Name(NameDetail::Condition {
                name: "_hovr".into(),
            })),
        },
        suggestion: Some("_hover".into()),
        external: false,
    };
    let line = Policy::render_resolve(&report);
    (DiagnosticFact::from(report), line)
}

fn invalid_reject(value: &str, key: OwnedLookupKey) -> (DiagnosticFact, Diagnostic) {
    let report = ResolveReport {
        location: located(),
        key: Some(key),
        outcome: ResolveOutcome::Rejected {
            code: DiagnosticCode::InvalidCssValue,
            detail: ResolveDetail::Declaration(DeclarationDetail::Value(
                ValueDetail::InvalidValue {
                    prop: "display".into(),
                    value: value.into(),
                },
            )),
        },
        suggestion: None,
        external: false,
    };
    let line = Policy::render_resolve(&report);
    (DiagnosticFact::from(report), line)
}

fn exact(key: OwnedLookupKey) -> DiagnosticFact {
    DiagnosticFact::ExactLookupExpected {
        site: site(),
        key,
        external: false,
    }
}

#[test]
fn absent_expected_key_replaces_its_legacy_line() {
    let key = key("color", serde_json::json!("red.500"));
    let (fact, line) = condition_reject(key.clone());
    let mut diagnostics = vec![line];
    render_session(
        &[exact(key), fact],
        &[],
        RenderScope::new("lib", &[]),
        &mut diagnostics,
    );
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(diagnostics[0].code, DiagnosticCode::UnknownCondition);
    assert!(diagnostics[0].message.contains("red.500"));
    assert!(diagnostics[0].message.contains("Unknown condition"));
    assert_eq!(diagnostics[0].file.as_deref(), Some("t.ts"));
    assert_eq!(
        diagnostics[0].help,
        Some(vec![
            "did you mean `_hover`?".to_string(),
            "use a condition from the theme".to_string(),
        ])
    );
}

#[test]
fn present_expected_key_drops_its_legacy_line() {
    let key = key("color", serde_json::json!("red"));
    let (fact, line) = condition_reject(key.clone());
    let mut diagnostics = vec![line];
    let plans = vec![plan("color", serde_json::json!("red"))];
    render_session(
        &[exact(key), fact],
        &plans,
        RenderScope::new("lib", &[]),
        &mut diagnostics,
    );
    assert!(diagnostics.is_empty());
}

#[test]
fn rejection_without_an_expectation_keeps_its_line() {
    let (fact, line) = condition_reject(key("color", serde_json::json!("red")));
    let mut diagnostics = vec![line.clone()];
    render_session(&[fact], &[], RenderScope::new("lib", &[]), &mut diagnostics);
    assert_eq!(diagnostics, vec![line]);
}

#[test]
fn causeless_miss_warns_once_per_key() {
    let key = key("color", serde_json::json!("red"));
    let mut diagnostics = Vec::new();
    render_session(
        &[exact(key.clone()), exact(key)],
        &[],
        RenderScope::new("lib", &[]),
        &mut diagnostics,
    );
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(diagnostics[0].code, DiagnosticCode::MissingStylePlan);
    assert!(diagnostics[0].message.contains("color"));
}

#[test]
fn duplicate_exact_with_reordered_object_keys_warns_once() {
    let mut first_map = serde_json::Map::new();
    first_map.insert("md".to_string(), serde_json::json!("60px"));
    first_map.insert("base".to_string(), serde_json::json!("50px"));
    let mut second_map = serde_json::Map::new();
    second_map.insert("base".to_string(), serde_json::json!("50px"));
    second_map.insert("md".to_string(), serde_json::json!("60px"));
    let first = key("width", serde_json::Value::Object(first_map));
    let second = key("width", serde_json::Value::Object(second_map));
    assert_eq!(first.lookup_key(), second.lookup_key());
    let mut diagnostics = Vec::new();
    render_session(
        &[exact(first), exact(second)],
        &[],
        RenderScope::new("lib", &[]),
        &mut diagnostics,
    );
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(diagnostics[0].code, DiagnosticCode::MissingStylePlan);
}

#[test]
fn duplicate_expected_keys_still_join_rejections() {
    let first = key("color", serde_json::json!("red.500"));
    let second = key("color", serde_json::json!("red.500"));
    let (fact, line) = condition_reject(first.clone());
    let mut diagnostics = vec![line];
    render_session(
        &[exact(first), exact(second), fact],
        &[],
        RenderScope::new("lib", &[]),
        &mut diagnostics,
    );
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(diagnostics[0].code, DiagnosticCode::UnknownCondition);
    assert!(diagnostics[0].message.contains("red.500"));
}

#[test]
fn spelling_divergence_at_one_position_warns_once() {
    let exact_key = key("top", serde_json::json!(16));
    let resolve_key = key("top", serde_json::json!("0x10"));
    let report = ResolveReport {
        location: located(),
        key: Some(resolve_key),
        outcome: ResolveOutcome::Rejected {
            code: DiagnosticCode::NonCanonicalNumeric,
            detail: ResolveDetail::Declaration(DeclarationDetail::Value(
                ValueDetail::NonCanonicalNumber {
                    prop: "top".into(),
                    spelling: "0x10".into(),
                },
            )),
        },
        suggestion: None,
        external: false,
    };
    let line = Policy::render_resolve(&report);
    let mut diagnostics = vec![line.clone()];
    render_session(
        &[exact(exact_key), DiagnosticFact::from(report)],
        &[],
        RenderScope::new("lib", &[]),
        &mut diagnostics,
    );
    assert_eq!(diagnostics, vec![line]);
}

#[test]
fn false_refusals_never_reach_userspace() {
    let key = key("display", serde_json::json!(false));
    let (fact, line) = invalid_reject("false", key.clone());
    let mut diagnostics = vec![line.clone()];
    render_session(
        &[exact(key), fact],
        &[],
        RenderScope::new("lib", &[]),
        &mut diagnostics,
    );
    assert_eq!(diagnostics, vec![line]);
}

#[test]
fn unknown_props_defer_to_extracts_jurisdiction() {
    let mut diagnostics = Vec::new();
    render_session(
        &[
            exact(key("fooBar", serde_json::json!("x"))),
            exact(key("_hover", serde_json::json!("red"))),
        ],
        &[],
        RenderScope::new("lib", &[]),
        &mut diagnostics,
    );
    assert!(diagnostics.is_empty());
}

#[test]
fn hole_valued_expectations_never_warn() {
    let mut diagnostics = Vec::new();
    render_session(
        &[
            exact(key("display", serde_json::json!(false))),
            exact(key("color", serde_json::Value::Null)),
        ],
        &[],
        RenderScope::new("lib", &[]),
        &mut diagnostics,
    );
    assert!(diagnostics.is_empty());
}

#[test]
fn true_refusals_prove_their_miss() {
    let key = key("display", serde_json::json!(true));
    let (fact, line) = invalid_reject("true", key.clone());
    let mut diagnostics = vec![line];
    render_session(
        &[exact(key), fact],
        &[],
        RenderScope::new("lib", &[]),
        &mut diagnostics,
    );
    assert_eq!(diagnostics.len(), 1);
    assert!(diagnostics[0].message.contains("display"));
    assert!(diagnostics[0].message.contains("true"));
}

mod external;

//! Pins the proof join for external (foreign-qualified) expectations: covered expectations stay
//! silent, missing ones warn once, and a rejection joins its foreign qualifier. The diet and proof
//! joins must agree on the same external facts.

use super::*;

/// An expectation recorded on an external block carries a foreign system;
/// with no matching plan it warns exactly once.
fn external_exact(system: &str, prop: &str, value: serde_json::Value) -> DiagnosticFact {
    DiagnosticFact::ExactLookupExpected {
        site: site(),
        key: OwnedLookupKey {
            system: system.into(),
            when: Vec::new(),
            prop: prop.into(),
            value,
            important: false,
        },
        external: true,
    }
}

fn qualifiers() -> Vec<String> {
    vec!["lib".to_string(), "icons".to_string()]
}

#[test]
fn covered_external_expectation_is_silent() {
    let facts = [external_exact("icons", "color", serde_json::json!("red"))];
    let plans = [RuntimeStylePlan {
        system: "icons".to_string(),
        ..plan("color", serde_json::json!("red"))
    }];
    let mut diagnostics = Vec::new();
    render_session(
        &facts,
        &plans,
        RenderScope::new("lib", &qualifiers()),
        &mut diagnostics,
    );
    assert!(diagnostics.is_empty(), "{diagnostics:?}");
}

#[test]
fn missing_external_expectation_warns_once() {
    let facts = [external_exact("icons", "color", serde_json::json!("red"))];
    let mut diagnostics = Vec::new();
    render_session(
        &facts,
        &[],
        RenderScope::new("lib", &qualifiers()),
        &mut diagnostics,
    );
    assert_eq!(diagnostics.len(), 1, "{diagnostics:?}");
    assert_eq!(diagnostics[0].code, DiagnosticCode::MissingStylePlan);
    assert!(diagnostics[0].message.contains("color"));
}

/// An external rejection (its resolver key is own-system) joins the
/// foreign-qualified expectation, so it rewrites its legacy line and
/// never double-warns.
#[test]
fn external_rejection_joins_its_foreign_qualifier() {
    let resolve_key = key("color", serde_json::json!("red.500"));
    let report = ResolveReport {
        location: located(),
        key: Some(resolve_key.clone()),
        outcome: ResolveOutcome::Rejected {
            code: DiagnosticCode::UnknownCondition,
            detail: ResolveDetail::Declaration(DeclarationDetail::Name(NameDetail::Condition {
                name: "_nope".into(),
            })),
        },
        suggestion: None,
        external: true,
    };
    let line = Policy::render_resolve(&report);
    let mut diagnostics = vec![line];
    let expected = external_exact("icons", "color", serde_json::json!("red.500"));
    let facts = [expected, DiagnosticFact::from(report)];
    render_session(
        &facts,
        &[],
        RenderScope::new("lib", &qualifiers()),
        &mut diagnostics,
    );
    assert_eq!(diagnostics.len(), 1, "{diagnostics:?}");
    assert_eq!(diagnostics[0].code, DiagnosticCode::UnknownCondition);
}

/// The diet path (carried keys) and the proof path (re-serialized plans)
/// join identically for external facts — the S4 join parity.
#[test]
fn diet_and_proof_joins_agree_for_external() {
    let own = key("color", serde_json::json!("red"));
    let foreign = OwnedLookupKey {
        system: "icons".into(),
        ..own.clone()
    };
    let facts = [
        DiagnosticFact::ExactLookupExpected {
            site: site(),
            key: foreign,
            external: true,
        },
        DiagnosticFact::ExactLookupExpected {
            site: site(),
            key: own,
            external: false,
        },
    ];
    let plans = [RuntimeStylePlan {
        system: "icons".to_string(),
        ..plan("color", serde_json::json!("red"))
    }];
    let mut proof_diags = Vec::new();
    render_session(
        &facts,
        &plans,
        RenderScope::new("lib", &qualifiers()),
        &mut proof_diags,
    );
    let mut diet_diags = Vec::new();
    render_session_with_keys(
        &facts,
        emitted_keys(&plans),
        RenderScope::new("lib", &qualifiers()),
        &mut diet_diags,
    );
    assert_eq!(proof_diags, diet_diags);
    // The foreign key is backed; the own key is a single causeless miss.
    assert_eq!(proof_diags.len(), 1, "{proof_diags:?}");
    assert_eq!(proof_diags[0].code, DiagnosticCode::MissingStylePlan);
}

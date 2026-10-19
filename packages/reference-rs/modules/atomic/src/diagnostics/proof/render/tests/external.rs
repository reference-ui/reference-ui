//! Pins the proof join for expectations on tags another system renders: covered expectations stay
//! silent, missing ones warn once, and a rejection joins the systems its own backing names, never
//! a system it does not. The diet and proof joins must agree on the same foreign facts.

use super::*;
use crate::atom::Backing;

fn icons() -> Backing {
    Backing::systems(["icons"])
}

/// An expectation recorded on a block icons renders carries that system;
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
        backing: icons(),
    }
}

#[test]
fn covered_external_expectation_is_silent() {
    let facts = [external_exact("icons", "color", serde_json::json!("red"))];
    let plans = [RuntimeStylePlan {
        system: "icons".to_string(),
        ..plan("color", serde_json::json!("red"))
    }];
    let mut diagnostics = Vec::new();
    render_session(&facts, &plans, RenderScope::new("lib"), &mut diagnostics);
    assert!(diagnostics.is_empty(), "{diagnostics:?}");
}

#[test]
fn missing_external_expectation_warns_once() {
    let facts = [external_exact("icons", "color", serde_json::json!("red"))];
    let mut diagnostics = Vec::new();
    render_session(&facts, &[], RenderScope::new("lib"), &mut diagnostics);
    assert_eq!(diagnostics.len(), 1, "{diagnostics:?}");
    assert_eq!(diagnostics[0].code, DiagnosticCode::MissingStylePlan);
    assert!(diagnostics[0].message.contains("color"));
}

/// A foreign rejection (its resolver key is own-system) joins the
/// expectation under its backing system, so it rewrites its legacy line and
/// never double-warns.
#[test]
fn external_rejection_joins_its_backing_system() {
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
        backing: icons(),
    };
    let line = Policy::render_resolve(&report);
    let mut diagnostics = vec![line];
    let expected = external_exact("icons", "color", serde_json::json!("red.500"));
    let facts = [expected, DiagnosticFact::from(report)];
    render_session(&facts, &[], RenderScope::new("lib"), &mut diagnostics);
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
            backing: icons(),
        },
        DiagnosticFact::ExactLookupExpected {
            site: site(),
            key: own,
            backing: Backing::Own,
        },
    ];
    let plans = [RuntimeStylePlan {
        system: "icons".to_string(),
        ..plan("color", serde_json::json!("red"))
    }];
    let mut proof_diags = Vec::new();
    render_session(&facts, &plans, RenderScope::new("lib"), &mut proof_diags);
    let mut diet_diags = Vec::new();
    render_session_with_keys(
        &facts,
        emitted_keys(&plans),
        RenderScope::new("lib"),
        &mut diet_diags,
    );
    assert_eq!(proof_diags, diet_diags);
    // The foreign key is backed; the own key is a single causeless miss.
    assert_eq!(proof_diags.len(), 1, "{proof_diags:?}");
    assert_eq!(proof_diags[0].code, DiagnosticCode::MissingStylePlan);
}

/// A rejection backed by a system the expectation does not name never joins
/// it: the expectation stays a causeless miss and the legacy line stays.
#[test]
fn rejection_never_joins_a_system_its_backing_does_not_name() {
    let report = ResolveReport {
        location: located(),
        key: Some(key("color", serde_json::json!("red.500"))),
        outcome: ResolveOutcome::Rejected {
            code: DiagnosticCode::UnknownCondition,
            detail: ResolveDetail::Declaration(DeclarationDetail::Name(NameDetail::Condition {
                name: "_nope".into(),
            })),
        },
        suggestion: None,
        backing: Backing::systems(["acme"]),
    };
    let line = Policy::render_resolve(&report);
    let mut diagnostics = vec![line.clone()];
    let expected = external_exact("icons", "color", serde_json::json!("red.500"));
    let facts = [expected, DiagnosticFact::from(report)];
    render_session(&facts, &[], RenderScope::new("lib"), &mut diagnostics);
    assert_eq!(diagnostics.len(), 2, "{diagnostics:?}");
    assert_eq!(diagnostics[0], line);
    assert_eq!(diagnostics[1].code, DiagnosticCode::MissingStylePlan);
}

//! Pins the extract adapter: a report converts to its fact, the plain note carries the pushed
//! triple verbatim, and the help variant carries the pushed lines. Fixtures build reports directly
//! so the adapter contract stands apart from the policy renderer.

use super::*;

#[test]
fn extract_report_converts_to_fact() {
    let report = ExtractReport {
        location: DiagnosticLocation {
            file: Some("a.ts".to_string()),
            line: Some(2),
            column: Some(9),
            span: None,
        },
        prop: "color".into(),
        when: Vec::new(),
        code: DiagnosticCode::DynamicIdentifier,
        detail: ExtractDetail::Leaf(crate::diagnostics::LeafDetail::Identifier {
            name: "space".into(),
        }),
        sink_recorded: true,
    };
    let fact = DiagnosticFact::from(report);
    let DiagnosticFact::ExtractOutcome {
        location,
        prop,
        when,
        outcome,
    } = fact
    else {
        panic!("extract reports convert to extract outcomes");
    };
    assert_eq!(location.file.as_deref(), Some("a.ts"));
    assert_eq!(prop.as_ref(), "color");
    assert!(when.is_empty());
    let ExtractOutcome::Refused {
        code,
        detail,
        sink_recorded,
    } = outcome;
    assert_eq!(code, DiagnosticCode::DynamicIdentifier);
    assert!(matches!(detail, ExtractDetail::Leaf(_)));
    assert!(sink_recorded);
}

#[test]
fn extract_note_carries_the_pushed_triple_verbatim() {
    let fact = super::extract_note(
        DiagnosticLocation {
            file: Some("a.ts".to_string()),
            line: Some(2),
            column: Some(9),
            span: None,
        },
        DiagnosticSeverity::Info,
        DiagnosticCode::DeadBranch,
        "dead arm skipped".to_string(),
    );
    let DiagnosticFact::ExtractNote {
        location,
        severity,
        code,
        message,
        help,
    } = fact
    else {
        panic!("extract notes convert to extract notes");
    };
    assert_eq!(location.file.as_deref(), Some("a.ts"));
    assert_eq!(severity, DiagnosticSeverity::Info);
    assert_eq!(code, DiagnosticCode::DeadBranch);
    assert_eq!(message.as_ref(), "dead arm skipped");
    assert_eq!(help, None);
}

#[test]
fn extract_note_with_help_carries_the_pushed_lines() {
    let fact = super::extract_note_with_help(
        DiagnosticLocation {
            file: Some("a.ts".to_string()),
            line: Some(2),
            column: Some(9),
            span: None,
        },
        DiagnosticCode::UnfoldableSpread,
        "spread keeps siblings".to_string(),
        Some(vec!["define 'mix' as a static style object".to_string()]),
    );
    let DiagnosticFact::ExtractNote { help, .. } = fact else {
        panic!("extract notes convert to extract notes");
    };
    assert_eq!(
        help,
        Some(vec!["define 'mix' as a static style object".to_string()])
    );
}

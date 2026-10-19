//! Pins the fact vocabulary: sinks collect facts in order, a block's backing targets the own system
//! or exactly the systems it names, lookup keys serialize their five-tuple canonically, and resolve outcomes tell a
//! drop from a passthrough. Fixtures build sites and owned keys by hand so each test isolates one
//! fact shape.

use super::*;
use crate::diagnostics::{SourceId, StyleSurfaceKind};
use oxc_span::Span;

fn site() -> SourceSite {
    SourceSite {
        source: SourceId(1),
        span: Span::new(0, 4),
        surface: StyleSurfaceKind::Css,
        prop: "color".into(),
        when: Vec::new(),
    }
}

fn key() -> OwnedLookupKey {
    OwnedLookupKey {
        system: "test".into(),
        when: Vec::new(),
        prop: "color".into(),
        value: serde_json::Value::String("red".to_string()),
        important: false,
    }
}

#[test]
fn vec_sink_collects_facts_in_order() {
    let mut sink: Vec<DiagnosticFact> = Vec::new();
    sink.report(DiagnosticFact::DynamicSlot {
        site: site(),
        shape: DynamicShape::UnknownValue,
    });
    sink.report(DiagnosticFact::ExactLookupExpected {
        site: site(),
        key: key(),
        backing: crate::atom::Backing::Own,
    });
    assert_eq!(sink.len(), 2);
    assert!(matches!(sink[0], DiagnosticFact::DynamicSlot { .. }));
    assert!(matches!(
        sink[1],
        DiagnosticFact::ExactLookupExpected { .. }
    ));
}

#[test]
fn own_backing_targets_the_own_system_only() {
    let own: Vec<&str> = crate::atom::Backing::Own.targets("own").collect();
    assert_eq!(own, vec!["own"]);
}

#[test]
fn foreign_backing_targets_exactly_its_systems() {
    let backing = crate::atom::Backing::systems(["icons", "bench"]);
    let foreign: Vec<&str> = backing.targets("own").collect();
    assert_eq!(foreign, vec!["icons", "bench"]);
    // A backing that names no system has nothing to target.
    assert_eq!(crate::atom::Backing::none().targets("own").count(), 0);
}

#[test]
fn lookup_key_serializes_the_five_tuple() {
    let key = key();
    assert_eq!(key.lookup_key(), r#"["test",[],"color","red",false]"#);
}

#[test]
fn lookup_key_sorts_object_values_canonically() {
    let mut key = key();
    key.prop = "width".into();
    key.value = serde_json::json!({"md": "60px", "base": "50px"});
    assert_eq!(
        key.lookup_key(),
        r#"["test",[],"width",{"base":"50px","md":"60px"},false]"#
    );
}

#[test]
fn lookup_key_keeps_nested_whens_and_important() {
    let mut key = key();
    key.when = vec!["_hover".into(), "_focus".into()];
    key.important = true;
    assert_eq!(
        key.lookup_key(),
        r#"["test",["_hover","_focus"],"color","red",true]"#
    );
}

#[test]
fn resolve_outcomes_distinguish_drop_from_passthrough() {
    let dropped = ResolveOutcome::Rejected {
        code: DiagnosticCode::UnknownCondition,
        detail: ResolveDetail::Declaration(DeclarationDetail::Name(NameDetail::Condition {
            name: "_nope".into(),
        })),
    };
    let painted = ResolveOutcome::Passthrough {
        code: DiagnosticCode::UnknownTokenPath,
        detail: ResolveDetail::Token(TokenDetail::UnknownTokenPath {
            path: "ui.ghost".into(),
        }),
    };
    assert_ne!(dropped, painted);
    assert!(matches!(dropped, ResolveOutcome::Rejected { .. }));
}

#[test]
fn extract_refusal_records_whether_a_sink_was_pushed() {
    let refused = ExtractOutcome::Refused {
        code: DiagnosticCode::DynamicIdentifier,
        detail: ExtractDetail::Leaf(LeafDetail::Identifier {
            name: "space".into(),
        }),
        sink_recorded: true,
    };
    let unstaged = ExtractOutcome::Refused {
        code: DiagnosticCode::MutatedBinding,
        detail: ExtractDetail::Leaf(LeafDetail::Generic),
        sink_recorded: false,
    };
    assert_ne!(refused, unstaged);
}

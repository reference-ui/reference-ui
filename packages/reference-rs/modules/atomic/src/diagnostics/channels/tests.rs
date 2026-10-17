//! Pins the channel partition: audiences land on separate lists, compiler-classified facts move to
//! the backchannel, and rendered lines echo and sweep exactly where the proof says. Fixtures
//! hand-build each fact beside its rendered diagnostic so every assertion names one routing rule.

use super::*;
use crate::diagnostics::adapters::extract::ExtractReport;
use crate::diagnostics::adapters::harvest::HarvestReport;
use crate::diagnostics::adapters::resolve::ResolveReport;
use crate::diagnostics::{
    DeclarationDetail, DiagnosticSeverity, DynamicShape, ExtractDetail, LeafDetail, NameDetail,
    OwnedLookupKey, ResolveDetail, ResolveOutcome, SourceId, SourceSite, StyleSurfaceKind,
    ValueDetail,
};
use oxc_span::Span;

fn warning(message: &str) -> Diagnostic {
    Diagnostic::warning(DiagnosticCode::UnfoldableSpread, message)
}

fn located() -> DiagnosticLocation {
    DiagnosticLocation {
        file: Some("t.ts".to_string()),
        line: Some(4),
        column: Some(19),
        span: None,
    }
}

fn funnel_pair() -> (DiagnosticFact, Diagnostic) {
    let report = ExtractReport {
        location: located(),
        prop: "color".into(),
        when: Vec::new(),
        code: DiagnosticCode::DynamicIdentifier,
        detail: ExtractDetail::Leaf(LeafDetail::Identifier {
            name: "theme".into(),
        }),
        sink_recorded: true,
    };
    let line = Policy::render_extract(&report);
    (DiagnosticFact::from(report), line)
}

fn harvest_pair() -> (DiagnosticFact, Diagnostic) {
    let report = HarvestReport {
        location: located(),
        prop: "color".into(),
        when: Vec::new(),
        minted: 2,
        offered: Vec::new(),
        external: false,
    };
    let line = Policy::render_harvest(&report);
    (DiagnosticFact::from(report), line)
}

fn note_pair() -> (DiagnosticFact, Diagnostic) {
    let help = Some(vec!["define 'mix' as a static style object".to_string()]);
    let fact = DiagnosticFact::ExtractNote {
        location: located(),
        severity: DiagnosticSeverity::Warning,
        code: DiagnosticCode::UnfoldableSpread,
        message: "spread keeps siblings".into(),
        help: help.clone(),
    };
    let line = Policy::attach_help(
        located().warning(DiagnosticCode::UnfoldableSpread, "spread keeps siblings"),
        help.unwrap_or_default(),
    );
    (fact, line)
}

fn invalid_pair(value: &str) -> (DiagnosticFact, Diagnostic) {
    let report = ResolveReport {
        location: located(),
        key: None,
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

fn passthrough_pair() -> (DiagnosticFact, Diagnostic) {
    let report = ResolveReport {
        location: located(),
        key: None,
        outcome: ResolveOutcome::Passthrough {
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

fn site() -> SourceSite {
    SourceSite {
        source: SourceId(0),
        span: Span::new(0, 5),
        surface: StyleSurfaceKind::Css,
        prop: "color".into(),
        when: Vec::new(),
    }
}

fn key() -> OwnedLookupKey {
    OwnedLookupKey {
        system: "lib".into(),
        when: Vec::new(),
        prop: "color".into(),
        value: serde_json::json!("red"),
        important: false,
    }
}

fn catalog() -> SourceCatalog<'static> {
    SourceCatalog::new(vec![("a.ts", "color: red")])
}

#[test]
fn audiences_land_on_separate_lists() {
    let mut channels = DiagnosticChannels::new();
    assert!(channels.is_empty());
    channels.push(Audience::Userspace, warning("user"));
    channels.push(Audience::Compiler, warning("compiler"));
    assert_eq!(channels.userspace.len(), 1);
    assert_eq!(channels.compiler.len(), 1);
    assert_eq!(channels.userspace[0].severity, DiagnosticSeverity::Warning);
    assert!(!channels.is_empty());
}

#[test]
fn compiler_facts_move_to_the_backchannel() {
    let (funnel_fact, funnel_line) = funnel_pair();
    let (harvest_fact, harvest_line) = harvest_pair();
    let (note_fact, note_line) = note_pair();
    let (false_fact, false_line) = invalid_pair("false");
    let facts = vec![funnel_fact, harvest_fact, note_fact, false_fact];
    let pushed = vec![
        funnel_line.clone(),
        harvest_line.clone(),
        note_line.clone(),
        false_line.clone(),
    ];
    let channels = DiagnosticChannels::partition(&facts, pushed, &catalog(), true);
    assert!(channels.userspace.is_empty());
    let moved = vec![funnel_line, harvest_line, note_line, false_line];
    assert_eq!(channels.compiler, moved);
}

#[test]
fn userspace_facts_keep_their_lines() {
    let (true_fact, true_line) = invalid_pair("true");
    let (pass_fact, pass_line) = passthrough_pair();
    let fatal = Diagnostic::error(DiagnosticCode::ParseError, "boom");
    let existing = DiagnosticFact::ExistingDiagnostic(fatal.clone());
    let facts = vec![true_fact, pass_fact, existing];
    let pushed = vec![true_line.clone(), pass_line.clone(), fatal.clone()];
    let channels = DiagnosticChannels::partition(&facts, pushed, &catalog(), true);
    assert_eq!(channels.userspace, vec![true_line, pass_line, fatal]);
    assert!(channels.compiler.is_empty());
}

#[test]
fn unknown_prop_notes_keep_the_default_line() {
    let fact = DiagnosticFact::ExtractNote {
        location: located(),
        severity: DiagnosticSeverity::Warning,
        code: DiagnosticCode::UnknownProperty,
        message: "Unknown style property \"frobnicate\"".into(),
        help: None,
    };
    let line = located().warning(
        DiagnosticCode::UnknownProperty,
        "Unknown style property \"frobnicate\"",
    );
    let channels = DiagnosticChannels::partition(&[fact], vec![line.clone()], &catalog(), true);
    assert_eq!(channels.userspace, vec![line]);
    assert!(channels.compiler.is_empty());
}

#[test]
fn unrequested_channel_still_strips_default() {
    let (funnel_fact, funnel_line) = funnel_pair();
    let (note_fact, note_line) = note_pair();
    let channels = DiagnosticChannels::partition(
        &[funnel_fact, note_fact],
        vec![funnel_line, note_line],
        &catalog(),
        false,
    );
    assert!(channels.userspace.is_empty());
    assert!(channels.compiler.is_empty());
}

#[test]
fn covered_lines_remove_as_noops() {
    let (funnel_fact, funnel_line) = funnel_pair();
    let channels = DiagnosticChannels::partition(&[funnel_fact], Vec::new(), &catalog(), true);
    assert!(channels.userspace.is_empty());
    assert_eq!(channels.compiler, vec![funnel_line]);
}

#[test]
fn false_echo_sweep_removes_unfacted_dupes() {
    let (false_fact, false_line) = invalid_pair("false");
    let channels = DiagnosticChannels::partition(
        &[false_fact],
        vec![false_line.clone(), false_line.clone()],
        &catalog(),
        true,
    );
    assert!(channels.userspace.is_empty());
    assert_eq!(channels.compiler, vec![false_line]);
}

#[test]
fn analysis_facts_render_fresh_without_stripping() {
    let exact = DiagnosticFact::ExactLookupExpected {
        site: site(),
        key: key(),
        external: false,
    };
    let dynamic = DiagnosticFact::DynamicSlot {
        site: site(),
        shape: DynamicShape::UnknownValue,
    };
    let facts = vec![exact, dynamic];
    let channels = DiagnosticChannels::partition(&facts, Vec::new(), &catalog(), true);
    assert!(channels.userspace.is_empty());
    assert_eq!(channels.compiler.len(), 2);
    assert_eq!(channels.compiler[0].code, DiagnosticCode::ExpectedLookup);
    assert!(channels.compiler[0].message.contains("color:red"));
    assert_eq!(channels.compiler[0].file.as_deref(), Some("a.ts"));
    assert_eq!(channels.compiler[1].code, DiagnosticCode::DynamicSlot);
    assert_eq!(channels.compiler[1].line, Some(1));
}

#[test]
fn unrequested_backchannel_leaves_default_untouched_by_analysis() {
    let exact = DiagnosticFact::ExactLookupExpected {
        site: site(),
        key: key(),
        external: false,
    };
    let dynamic = DiagnosticFact::DynamicSlot {
        site: site(),
        shape: DynamicShape::UnknownValue,
    };
    let kept = warning("stays");
    let channels =
        DiagnosticChannels::partition(&[exact, dynamic], vec![kept.clone()], &catalog(), false);
    assert_eq!(channels.userspace, vec![kept]);
    assert!(channels.compiler.is_empty());
}

#[test]
fn empty_default_and_unrequested_backchannel_render_nothing() {
    let (funnel_fact, _) = funnel_pair();
    let (false_fact, _) = invalid_pair("false");
    let exact = DiagnosticFact::ExactLookupExpected {
        site: site(),
        key: key(),
        external: false,
    };
    let facts = vec![funnel_fact, false_fact, exact];
    let channels = DiagnosticChannels::partition(&facts, Vec::new(), &catalog(), false);
    assert!(channels.userspace.is_empty());
    assert!(channels.compiler.is_empty());
}

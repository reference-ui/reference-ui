//! Userspace/compiler channel partition for final diagnostics.
//!
//! `diagnostics` carries existing errors plus proof-backed warnings;
//! `compilerDiagnostics` carries the opt-in backchannel and stays absent
//! unless requested. Hosts never re-filter one mixed array. Partition runs
//! once at end of compile: every compiler-classified fact strips its
//! re-derived legacy line from default and, only when requested, renders
//! the line onto the backchannel. Per-fact rendering lives in `render`.

mod render;

use render::{is_false_refusal, render_fact};

use super::proof::lines::{find_line, remove_line};
use super::{
    Audience, Diagnostic, DiagnosticCode, DiagnosticFact, DiagnosticLocation, Policy, SourceCatalog,
};

/// The two final diagnostic lists for one compile.
#[derive(Debug, Default)]
pub struct DiagnosticChannels {
    /// Default channel: errors plus proof-backed warnings.
    pub userspace: Vec<Diagnostic>,
    /// Opt-in backchannel: populated only when requested.
    pub compiler: Vec<Diagnostic>,
}

impl DiagnosticChannels {
    /// Empty channels for a new compile.
    pub fn new() -> Self {
        Self {
            userspace: Vec::new(),
            compiler: Vec::new(),
        }
    }

    /// Push one diagnostic onto its audience's list.
    pub fn push(&mut self, audience: Audience, diagnostic: Diagnostic) {
        match audience {
            Audience::Userspace => self.userspace.push(diagnostic),
            Audience::Compiler => self.compiler.push(diagnostic),
        }
    }

    /// True when both lists are empty.
    pub fn is_empty(&self) -> bool {
        self.userspace.is_empty() && self.compiler.is_empty()
    }

    /// Partition pushed lines by fact audience. Compiler-classified facts
    /// strip their re-derived legacy line from default and, only when
    /// requested, render it onto the backchannel. Analysis facts render
    /// fresh (never pushed, nothing to strip); covered-sink removals no-op
    /// harmlessly. A final echo sweep reaps unfacted re-resolve dupes.
    pub fn partition(
        facts: &[DiagnosticFact],
        diagnostics: Vec<Diagnostic>,
        catalog: &SourceCatalog,
        render_compiler: bool,
    ) -> DiagnosticChannels {
        let mut channels = DiagnosticChannels {
            userspace: diagnostics,
            compiler: Vec::new(),
        };
        let mut false_echoes: Vec<EchoTriple> = Vec::new();
        for fact in facts {
            if Policy::classify(fact) != Audience::Compiler {
                continue;
            }
            let Some(line) = render_fact(fact, catalog) else {
                continue;
            };
            if is_pushed_fact(fact) {
                remove_rendered(&mut channels.userspace, &line);
            }
            if is_false_fact(fact) {
                false_echoes.push(EchoTriple::from_line(&line));
            }
            if render_compiler {
                channels.compiler.push(line);
            }
        }
        sweep_false_echoes(&mut channels.userspace, &false_echoes);
        channels
    }
}

/// One hole-valued refusal identity for the echo sweep: re-resolve echoes
/// carry no fact, so the sweep reaps every remaining identity match.
struct EchoTriple {
    code: DiagnosticCode,
    location: DiagnosticLocation,
    message: String,
}

impl EchoTriple {
    /// The identity of one rendered line: code plus its own position.
    fn from_line(line: &Diagnostic) -> Self {
        Self {
            code: line.code,
            location: DiagnosticLocation {
                file: line.file.clone(),
                line: line.line,
                column: line.column,
            },
            message: line.message.clone(),
        }
    }
}

/// Exact expectations and dynamic slots were never pushed; every other
/// compiler fact re-derives a pushed legacy line to strip.
fn is_pushed_fact(fact: &DiagnosticFact) -> bool {
    !matches!(
        fact,
        DiagnosticFact::ExactLookupExpected { .. } | DiagnosticFact::DynamicSlot { .. }
    )
}

/// True when one rendered fact is a hole-valued resolve refusal.
fn is_false_fact(fact: &DiagnosticFact) -> bool {
    matches!(
        fact,
        DiagnosticFact::ResolveOutcome { outcome, .. } if is_false_refusal(outcome)
    )
}

/// Drop one rendered line's identity match from the default channel.
fn remove_rendered(userspace: &mut Vec<Diagnostic>, line: &Diagnostic) {
    let location = DiagnosticLocation {
        file: line.file.clone(),
        line: line.line,
        column: line.column,
    };
    remove_line(userspace, line.code, &location, &line.message);
}

/// Reap every remaining identity match per hole-valued refusal: re-resolve
/// echoes carry no fact, so the sweep makes removal count-free.
fn sweep_false_echoes(userspace: &mut Vec<Diagnostic>, echoes: &[EchoTriple]) {
    for echo in echoes {
        while find_line(userspace, echo.code, &echo.location, &echo.message).is_some() {
            remove_line(userspace, echo.code, &echo.location, &echo.message);
        }
    }
}

#[cfg(test)]
mod tests {
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
        }
    }

    fn funnel_pair() -> (DiagnosticFact, Diagnostic) {
        let report = ExtractReport {
            location: located(),
            prop: "color".into(),
            when: Vec::new(),
            code: DiagnosticCode::DynamicIdentifier,
            detail: ExtractDetail::Leaf(LeafDetail::Identifier { name: "theme".into() }),
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
        };
        let line = Policy::render_harvest(&report);
        (DiagnosticFact::from(report), line)
    }

    fn note_pair() -> (DiagnosticFact, Diagnostic) {
        let fact = DiagnosticFact::ExtractNote {
            location: located(),
            severity: DiagnosticSeverity::Warning,
            code: DiagnosticCode::UnfoldableSpread,
            message: "spread keeps siblings".into(),
        };
        let line = located().warning(DiagnosticCode::UnfoldableSpread, "spread keeps siblings");
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
        };
        let line = located().warning(
            DiagnosticCode::UnknownProperty,
            "Unknown style property \"frobnicate\"",
        );
        let channels =
            DiagnosticChannels::partition(&[fact], vec![line.clone()], &catalog(), true);
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
        let exact = DiagnosticFact::ExactLookupExpected { site: site(), key: key() };
        let dynamic = DiagnosticFact::DynamicSlot { site: site(), shape: DynamicShape::UnknownValue };
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
}

//! Extraction adapter: refusals and outcomes as facts. Owns the ledger D
//! dynamic refusals that funnel through `warn_dynamic` (sinks stay coupled
//! to the refusal there); wording moves to policy. Plain `warn`/`info`
//! sites (residue, mutation, token-call, dead-branch, object structure)
//! stay direct until Slice 5 moves the compiler block as one.

use super::super::{
    DiagnosticCode, DiagnosticFact, DiagnosticLocation, DiagnosticSeverity, ExtractDetail,
    ExtractOutcome,
};

/// One refused dynamic value position, ready to report as a fact.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ExtractReport {
    pub location: DiagnosticLocation,
    pub prop: Box<str>,
    pub when: Vec<Box<str>>,
    pub code: DiagnosticCode,
    pub detail: ExtractDetail,
    pub sink_recorded: bool,
}

impl From<ExtractReport> for DiagnosticFact {
    fn from(report: ExtractReport) -> Self {
        DiagnosticFact::ExtractOutcome {
            location: report.location,
            prop: report.prop,
            when: report.when,
            outcome: ExtractOutcome::Refused {
                code: report.code,
                detail: report.detail,
                sink_recorded: report.sink_recorded,
            },
        }
    }
}

/// One compiler-only extract note from a warn/info helper: the pushed
/// line's own triple, carried verbatim for the S5 partition.
pub fn extract_note(
    location: DiagnosticLocation,
    severity: DiagnosticSeverity,
    code: DiagnosticCode,
    message: String,
) -> DiagnosticFact {
    extract_note_with_help(location, severity, code, message, None)
}

/// One extract note with its pushed instance help, carried so the compiler
/// re-render re-attaches it. Help-less sites keep calling `extract_note`.
pub fn extract_note_with_help(
    location: DiagnosticLocation,
    severity: DiagnosticSeverity,
    code: DiagnosticCode,
    message: String,
    help: Option<Vec<String>>,
) -> DiagnosticFact {
    DiagnosticFact::ExtractNote {
        location,
        severity,
        code,
        message: message.into(),
        help,
    }
}

#[cfg(test)]
mod tests {
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
            DiagnosticSeverity::Warning,
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
}

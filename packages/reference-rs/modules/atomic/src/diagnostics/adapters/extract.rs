//! Extraction adapter: refusals and outcomes as facts. Owns the ledger D
//! dynamic refusals that funnel through `warn_dynamic` (sinks stay coupled
//! to the refusal there); wording moves to policy. Plain `warn`/`info`
//! sites (residue, mutation, token-call, dead-branch, object structure)
//! stay direct until the compiler block moves as one.

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
/// line's own triple, carried verbatim for the partition.
pub fn extract_note(
    location: DiagnosticLocation,
    severity: DiagnosticSeverity,
    code: DiagnosticCode,
    message: String,
) -> DiagnosticFact {
    DiagnosticFact::ExtractNote {
        location,
        severity,
        code,
        message: message.into(),
        help: None,
    }
}

/// One warning-severity extract note with its pushed instance help, carried so the
/// compiler re-render re-attaches it. Help-less sites keep calling `extract_note`;
/// the warning severity is fixed here because every help-bearing site is a warning.
pub fn extract_note_with_help(
    location: DiagnosticLocation,
    code: DiagnosticCode,
    message: String,
    help: Option<Vec<String>>,
) -> DiagnosticFact {
    DiagnosticFact::ExtractNote {
        location,
        severity: DiagnosticSeverity::Warning,
        code,
        message: message.into(),
        help,
    }
}

#[cfg(test)]
mod tests;

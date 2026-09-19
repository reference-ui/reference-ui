//! Host adapter: StyleTrace and host facts as facts. Owns the ledger H
//! family. Dependencies keep their own diagnostic types; this boundary
//! converts them, mirroring `hosts/diagnostics.rs` (file-only location).
//! Slice 3 migrates the host conversion call site.

use super::super::{Diagnostic, DiagnosticCode, DiagnosticFact};

/// One skipped host trace, ready to report as a fact.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HostReport {
    pub file: Option<String>,
    pub message: String,
}

impl From<HostReport> for DiagnosticFact {
    fn from(report: HostReport) -> Self {
        let warning = Diagnostic::warning(DiagnosticCode::TraceSkipped, report.message);
        let diagnostic = match report.file {
            Some(file) => warning.with_location(file, None, None),
            None => warning,
        };
        DiagnosticFact::ExistingError(diagnostic)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::diagnostics::DiagnosticSeverity;

    #[test]
    fn host_report_converts_to_file_only_fact() {
        let fact = DiagnosticFact::from(HostReport {
            file: Some("entry.ts".to_string()),
            message: "trace skipped".to_string(),
        });
        let DiagnosticFact::ExistingError(diagnostic) = fact else {
            panic!("host reports convert to existing errors");
        };
        assert_eq!(diagnostic.severity, DiagnosticSeverity::Warning);
        assert_eq!(diagnostic.code, DiagnosticCode::TraceSkipped);
        assert_eq!(diagnostic.file.as_deref(), Some("entry.ts"));
        assert_eq!(diagnostic.line, None);
    }

    #[test]
    fn host_report_without_file_stays_unlocated() {
        let fact = DiagnosticFact::from(HostReport {
            file: None,
            message: "trace skipped".to_string(),
        });
        let DiagnosticFact::ExistingError(diagnostic) = fact else {
            panic!("host reports convert to existing errors");
        };
        assert_eq!(diagnostic.file, None);
    }
}

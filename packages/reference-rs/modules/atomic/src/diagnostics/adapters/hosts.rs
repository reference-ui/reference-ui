//! Host adapter: StyleTrace and host facts as facts. Owns the ledger H
//! family. Dependencies keep their own diagnostic types; this boundary
//! converts them, mirroring `hosts/diagnostics.rs` (file-only location).
//! The message stays dependency prose (like `ATM-E-*` pass-throughs);
//! policy owns the code, severity, and file-only wrap.

use super::super::DiagnosticFact;

/// One skipped host trace, ready to report as a fact.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HostReport {
    pub file: Option<String>,
    pub message: String,
}

impl From<HostReport> for DiagnosticFact {
    fn from(report: HostReport) -> Self {
        DiagnosticFact::HostOutcome {
            file: report.file.map(String::into_boxed_str),
            message: report.message.into_boxed_str(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn host_report_converts_to_host_outcome() {
        let fact = DiagnosticFact::from(HostReport {
            file: Some("entry.ts".to_string()),
            message: "trace skipped".to_string(),
        });
        let DiagnosticFact::HostOutcome { file, message } = fact else {
            panic!("host reports convert to host outcomes");
        };
        assert_eq!(file.as_deref(), Some("entry.ts"));
        assert_eq!(message.as_ref(), "trace skipped");
    }

    #[test]
    fn host_report_without_file_stays_unlocated() {
        let fact = DiagnosticFact::from(HostReport {
            file: None,
            message: "trace skipped".to_string(),
        });
        assert!(matches!(
            fact,
            DiagnosticFact::HostOutcome { file: None, .. }
        ));
    }
}

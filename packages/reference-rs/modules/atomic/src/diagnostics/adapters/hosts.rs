//! Host adapter: StyleTrace and host facts as facts. Owns the ledger H
//! family. Dependencies keep their own diagnostic types; this boundary
//! converts them, mirroring `hosts/diagnostics.rs` (file-only location).
//! The message stays dependency prose (like `ATM-E-*` pass-throughs); the code
//! is the StyleTrace code that minted the skip, forwarded unchanged. Policy owns
//! the severity and file-only wrap.

use super::super::{DiagnosticCode, DiagnosticFact};

/// One skipped host trace, ready to report as a fact.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HostReport {
    pub code: DiagnosticCode,
    pub file: Option<String>,
    pub message: String,
}

impl From<HostReport> for DiagnosticFact {
    fn from(report: HostReport) -> Self {
        DiagnosticFact::HostOutcome {
            code: report.code,
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
            code: DiagnosticCode::Styletrace(styletrace::StyletraceDiagnosticCode::SkippedFile),
            file: Some("entry.ts".to_string()),
            message: "trace skipped".to_string(),
        });
        let DiagnosticFact::HostOutcome {
            code,
            file,
            message,
        } = fact
        else {
            panic!("host reports convert to host outcomes");
        };
        assert_eq!(code.as_str(), "STT-W-SKIPPED-FILE");
        assert_eq!(file.as_deref(), Some("entry.ts"));
        assert_eq!(message.as_ref(), "trace skipped");
    }

    #[test]
    fn host_report_without_file_stays_unlocated() {
        let fact = DiagnosticFact::from(HostReport {
            code: DiagnosticCode::TraceSkipped,
            file: None,
            message: "trace skipped".to_string(),
        });
        assert!(matches!(
            fact,
            DiagnosticFact::HostOutcome { file: None, .. }
        ));
    }
}

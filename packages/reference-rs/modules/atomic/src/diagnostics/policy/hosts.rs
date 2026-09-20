//! Host skip wording: the dependency message wrapped file-only.
//!
//! StyleTrace owns the sentence (like `ATM-E-*` pass-throughs); policy owns
//! the code, severity, and file-only wrap, byte-identical to the legacy
//! `hosts/diagnostics.rs` conversion it replaces.

use super::super::adapters::hosts::HostReport;
use super::super::{Diagnostic, DiagnosticCode};

/// Render one host skip report to its final warning line.
pub fn render(report: &HostReport) -> Diagnostic {
    let warning = Diagnostic::warning(DiagnosticCode::TraceSkipped, report.message.clone());
    match &report.file {
        Some(file) => warning.with_location(file.clone(), None, None),
        None => warning,
    }
}

#[cfg(test)]
mod tests {
    use super::super::Policy;
    use super::*;
    use crate::diagnostics::DiagnosticSeverity;

    #[test]
    fn host_sentence_pins_legacy_wrap() {
        let rendered = Policy::render_host(&HostReport {
            file: Some("entry.ts".to_string()),
            message: "trace skipped: unparsable".to_string(),
        });
        assert_eq!(rendered.severity, DiagnosticSeverity::Warning);
        assert_eq!(rendered.code, DiagnosticCode::TraceSkipped);
        assert_eq!(rendered.message, "trace skipped: unparsable");
        assert_eq!(rendered.file.as_deref(), Some("entry.ts"));
        assert_eq!(rendered.line, None);
        let bare = Policy::render_host(&HostReport {
            file: None,
            message: "trace skipped".to_string(),
        });
        assert_eq!(bare.file, None);
    }
}

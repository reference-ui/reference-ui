//! Host skip wording: the dependency message wrapped file-only.
//!
//! StyleTrace owns the sentence (like `ATM-E-*` pass-throughs) and the code
//! that minted it; policy owns severity and the file-only location. No host
//! skip carries engine help: each StyleTrace code's remedy is its static hint,
//! and engine help would outrank that hint in the verbose line.

use super::super::adapters::hosts::HostReport;
use super::super::Diagnostic;

/// Render one host skip report to its final warning line, located at its file when it has one.
pub fn render(report: &HostReport) -> Diagnostic {
    let warning = Diagnostic::warning(report.code, report.message.clone());
    match &report.file {
        Some(file) => warning.with_location(file.clone(), None, None),
        None => warning,
    }
}

#[cfg(test)]
mod tests {
    use super::super::Policy;
    use super::*;
    use crate::diagnostics::{DiagnosticCode, DiagnosticSeverity};
    use styletrace::StyletraceDiagnosticCode;

    #[test]
    fn host_skip_keeps_its_styletrace_code_without_engine_help() {
        let rendered = Policy::render_host(&HostReport {
            code: DiagnosticCode::Styletrace(StyletraceDiagnosticCode::SkippedFile),
            file: Some("entry.ts".to_string()),
            message: "trace skipped: unparsable".to_string(),
        });
        assert_eq!(rendered.severity, DiagnosticSeverity::Warning);
        assert_eq!(rendered.code.as_str(), "STT-W-SKIPPED-FILE");
        assert_eq!(rendered.message, "trace skipped: unparsable");
        assert_eq!(rendered.file.as_deref(), Some("entry.ts"));
        assert_eq!(rendered.line, None);
        assert_eq!(rendered.help, None);
        let bare = Policy::render_host(&HostReport {
            code: DiagnosticCode::Styletrace(StyletraceDiagnosticCode::SkippedFile),
            file: None,
            message: "trace skipped".to_string(),
        });
        assert_eq!(bare.file, None);
        assert_eq!(bare.help, None);
    }

    #[test]
    fn class_component_skip_keeps_its_code() {
        let rendered = Policy::render_host(&HostReport {
            code: DiagnosticCode::Styletrace(StyletraceDiagnosticCode::ClassComponent),
            file: Some("Card.tsx".to_string()),
            message: "StyleTrace: class component `Card` is not traced".to_string(),
        });
        assert_eq!(rendered.severity, DiagnosticSeverity::Warning);
        assert_eq!(rendered.code.as_str(), "STT-W-CLASS-COMPONENT");
        assert_eq!(rendered.file.as_deref(), Some("Card.tsx"));
        assert_eq!(rendered.help, None);
    }
}

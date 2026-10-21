//! Host skip wording: the dependency message wrapped file-only.
//!
//! StyleTrace owns the sentence (like `ATM-E-*` pass-throughs) and the code
//! that minted it; policy owns severity and the file-only wrap, which stays
//! byte-identical to the legacy `hosts/diagnostics.rs` conversion it replaces.
//! Only the generic trace-skipped code carries the host-graph help line: a
//! StyleTrace code's remedy is its static hint, and engine help would outrank it.

use super::super::adapters::hosts::HostReport;
use super::super::{Diagnostic, DiagnosticCode};

/// Render one host skip report to its final warning line.
pub fn render(report: &HostReport) -> Diagnostic {
    let warning = Diagnostic::warning(report.code, report.message.clone());
    match &report.file {
        Some(file) => {
            let line = warning.with_location(file.clone(), None, None);
            super::Policy::attach_help(line, help_lines(report.code, file))
        }
        None => warning,
    }
}

/// Instance help for a located skip: only the generic code names the host graph.
fn help_lines(code: DiagnosticCode, file: &str) -> Vec<String> {
    match code {
        DiagnosticCode::TraceSkipped => {
            vec![format!("check the StyleTrace host graph for '{file}'")]
        }
        _ => Vec::new(),
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
            code: DiagnosticCode::TraceSkipped,
            file: Some("entry.ts".to_string()),
            message: "trace skipped: unparsable".to_string(),
        });
        assert_eq!(rendered.severity, DiagnosticSeverity::Warning);
        assert_eq!(rendered.code, DiagnosticCode::TraceSkipped);
        assert_eq!(rendered.message, "trace skipped: unparsable");
        assert_eq!(rendered.file.as_deref(), Some("entry.ts"));
        assert_eq!(rendered.line, None);
        assert_eq!(
            rendered.help,
            Some(vec![
                "check the StyleTrace host graph for 'entry.ts'".to_string()
            ])
        );
        let bare = Policy::render_host(&HostReport {
            code: DiagnosticCode::TraceSkipped,
            file: None,
            message: "trace skipped".to_string(),
        });
        assert_eq!(bare.file, None);
        assert_eq!(bare.help, None);
    }

    #[test]
    fn styletrace_code_keeps_its_identity_and_drops_the_generic_help() {
        let rendered = Policy::render_host(&HostReport {
            code: DiagnosticCode::Styletrace(styletrace::StyletraceDiagnosticCode::ClassComponent),
            file: Some("Card.tsx".to_string()),
            message: "StyleTrace: class component `Card` is not traced".to_string(),
        });
        assert_eq!(rendered.severity, DiagnosticSeverity::Warning);
        assert_eq!(rendered.code.as_str(), "STT-W-CLASS-COMPONENT");
        assert_eq!(rendered.file.as_deref(), Some("Card.tsx"));
        assert_eq!(rendered.help, None);
    }
}

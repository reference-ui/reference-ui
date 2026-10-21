//! Trace-failure reporting for host discovery.
//! Turns per-file StyleTrace diagnostics into host skip reports so one
//! unparsable entry neither fails the compile nor silences its siblings.
//! Each report keeps the StyleTrace code that minted it; only a diagnostic
//! that names no StyleTrace code falls back to the generic trace-skipped code.
//! Policy owns the final file-only warning wrap.

use crate::diagnostics::{adapters::hosts::HostReport, DiagnosticCode};

/// One host skip report per trace diagnostic, under the code styletrace minted it with.
pub(crate) fn convert_trace_diagnostic(diagnostic: styletrace::StyletraceDiagnostic) -> HostReport {
    HostReport {
        code: trace_code(diagnostic.code.as_str()),
        file: diagnostic.file,
        message: diagnostic.message,
    }
}

/// The forwarded StyleTrace code for a diagnostic's code text. Text that names no StyleTrace
/// code keeps the generic code, so a skip is reported rather than dropped.
fn trace_code(text: &str) -> DiagnosticCode {
    match text.parse::<styletrace::StyletraceDiagnosticCode>() {
        Ok(code) => DiagnosticCode::Styletrace(code),
        Err(_) => DiagnosticCode::TraceSkipped,
    }
}

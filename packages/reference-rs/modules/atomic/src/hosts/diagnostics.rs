//! Trace-failure reporting for host discovery.
//! Turns per-file StyleTrace diagnostics into host skip reports so one
//! unparsable entry neither fails the compile nor silences its siblings.
//! StyleTrace mints every outcome diagnostic from its own code table, so each
//! report forwards the StyleTrace code unchanged. Policy owns the final
//! file-only warning wrap.

use crate::diagnostics::{adapters::hosts::HostReport, DiagnosticCode};

/// One host skip report per trace diagnostic, under the StyleTrace code that minted it.
pub(crate) fn convert_trace_diagnostic(diagnostic: styletrace::StyletraceDiagnostic) -> HostReport {
    HostReport {
        code: DiagnosticCode::Styletrace(trace_code(diagnostic.code.as_str())),
        file: diagnostic.file,
        message: diagnostic.message,
    }
}

/// The StyleTrace code a diagnostic's text names. It always parses: StyleTrace builds outcome
/// diagnostics only from its typed table, so a miss is a styletrace bug. Failing loudly beats
/// reporting the skip under a code the registry never assigned to it.
fn trace_code(text: &str) -> styletrace::StyletraceDiagnosticCode {
    match text.parse::<styletrace::StyletraceDiagnosticCode>() {
        Ok(code) => code,
        Err(error) => unreachable!("styletrace outcome diagnostics carry its own codes: {error}"),
    }
}

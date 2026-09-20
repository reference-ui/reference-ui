//! Trace-failure reporting for host discovery.
//! Turns per-file StyleTrace failures into host skip reports so one
//! unparsable entry neither fails the compile nor silences its siblings.
//! Policy owns the final file-only warning wrap.

use crate::diagnostics::adapters::hosts::HostReport;

/// One host skip report per skipped trace file.
pub(crate) fn convert_trace_diagnostic(diagnostic: styletrace::TraceDiagnostic) -> HostReport {
    HostReport {
        file: diagnostic
            .file
            .map(|path| path.to_string_lossy().to_string()),
        message: diagnostic.message,
    }
}

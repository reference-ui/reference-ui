//! Trace-failure reporting for host discovery.
//! Turns per-file StyleTrace failures into located compile warnings so one
//! unparsable entry neither fails the compile nor silences its siblings.

use crate::Diagnostic;

/// One located warning per skipped trace file.
pub(crate) fn render_trace_diagnostic(diagnostic: styletrace::TraceDiagnostic) -> Diagnostic {
    let warning = Diagnostic::warning(diagnostic.message);
    match diagnostic.file {
        Some(file) => warning.with_location(file.to_string_lossy().to_string(), None, None),
        None => warning,
    }
}

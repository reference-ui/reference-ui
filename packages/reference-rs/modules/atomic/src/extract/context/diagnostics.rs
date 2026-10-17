//! Diagnostic reporting for the extraction session: located warnings, info, and the once-per-file
//! missing-graph error. Each report lands in two places: the located `Diagnostic` the compile
//! result carries, and a session note that the compiler re-renders with its help text. Locations
//! come from the span through the file's source text, so a missing source degrades to a file-only
//! location. Takes a span or tag and emits diagnostics into the context's sinks; nothing here
//! changes which styles fold.

use oxc_span::Span;

use crate::diagnostics::adapters::extract::{extract_note, extract_note_with_help};
use crate::diagnostics::{
    byte_span, line_col, Diagnostic, DiagnosticCode, DiagnosticLocation, DiagnosticSeverity,
    DiagnosticSink, Policy,
};

use super::ExtractContext;

impl<'a> ExtractContext<'a> {
    /// Report a diagnostic warning at the offending node's span.
    pub fn warn(&mut self, span: Span, code: DiagnosticCode, message: impl Into<String>) {
        let message: String = message.into();
        let (line, column) = self
            .source
            .and_then(|source| line_col(source, span.start))
            .unzip();
        let location = DiagnosticLocation {
            file: Some(self.file.to_string()),
            line,
            column,
            span: Some(byte_span(span)),
        };
        self.diagnostics
            .push(location.warning(code, message.clone()));
        self.session.report(extract_note(
            location,
            DiagnosticSeverity::Warning,
            code,
            message,
        ));
    }

    /// Report a warning with instance help at the offending node's span.
    /// The help rides the pushed line and the session fact alike, so the
    /// compiler re-render re-attaches it.
    pub fn warn_help(
        &mut self,
        span: Span,
        code: DiagnosticCode,
        message: impl Into<String>,
        help: Vec<String>,
    ) {
        let message: String = message.into();
        let (line, column) = self
            .source
            .and_then(|source| line_col(source, span.start))
            .unzip();
        let location = DiagnosticLocation {
            file: Some(self.file.to_string()),
            line,
            column,
            span: Some(byte_span(span)),
        };
        self.diagnostics.push(Policy::attach_help(
            location.warning(code, message.clone()),
            help.clone(),
        ));
        self.session.report(extract_note_with_help(
            location,
            code,
            message,
            Some(help),
        ));
    }

    /// Report an info diagnostic at the offending node's span.
    pub fn info(&mut self, span: Span, code: DiagnosticCode, message: impl Into<String>) {
        let message: String = message.into();
        let (line, column) = self
            .source
            .and_then(|source| line_col(source, span.start))
            .unzip();
        let location = DiagnosticLocation {
            file: Some(self.file.to_string()),
            line,
            column,
            span: Some(byte_span(span)),
        };
        self.diagnostics.push(location.info(code, message.clone()));
        self.session.report(extract_note(
            location,
            DiagnosticSeverity::Info,
            code,
            message,
        ));
    }

    /// Record the missing-graph error once per file. With no hosts
    /// resolvable, style-bearing JSX is skipped instead of scanned.
    pub fn report_missing_graph(&mut self, tag: &str, line: Option<u32>, column: Option<u32>) {
        if self.missing_graph_reported {
            return;
        }
        self.missing_graph_reported = true;
        self.diagnostics.push(
            Diagnostic::error(
                DiagnosticCode::MissingHostGraph,
                format!(
                    "no StyleProps hosts resolvable (missing primitive graph); skipped styles on <{tag}>"
                ),
            )
            .with_location(self.file, line, column),
        );
    }
}

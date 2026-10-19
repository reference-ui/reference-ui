//! The expression-walk session: the recording surface a walk writes through, covering want pushes,
//! located warnings, info notes, and dynamic refusals. Each method reports into the same sinks the
//! walk owns, so every shape records its wants and diagnostics through one path. Takes the walk's
//! own fields and emits wants, diagnostics, and sink entries on the session.

use super::{DynamicRefusal, ExpressionWalk};
use oxc_span::{Span};
use smallvec::SmallVec;

use crate::atom::{AtomValue, Want};
use crate::diagnostics::adapters::extract::{extract_note, extract_note_with_help, ExtractReport};
use crate::diagnostics::{
    byte_span, line_col, DiagnosticCode, DiagnosticFact, DiagnosticLocation, DiagnosticSeverity,
    DiagnosticSink, Policy,
};
use crate::extract::harvest::{is_sink_code, Sink, SinkSite};

impl<'a> ExpressionWalk<'a> {
    /// Return the breakpoint condition name for a responsive array index.
    pub fn breakpoint_for_index(&self, index: usize) -> Option<&str> {
        // mt={['1r', '2r', '4r']}  →  0=base, 1=sm, 2=md
        self.breakpoints.breakpoint_for_index(index)
    }

    /// Push an extracted Want to the collection.
    pub fn push_want(
        &mut self,
        value: AtomValue,
        when: SmallVec<[Box<str>; 2]>,
        important: bool,
        span: Option<Span>,
    ) {
        let mut want = Want::new(self.prop, value)
            .with_when(when)
            .with_important(self.important || important)
            .with_origin(self.origin)
            .with_oxc_span(span);
        want.backing = self.backing.clone();
        want.file = Some(self.file.into());
        if let Some(position) = self.span_position(span) {
            want.line = Some(position.0);
            want.column = Some(position.1);
        }
        self.wants.push(want);
    }

    /// 1-based line/column for a literal span, or None without source text.
    fn span_position(&self, span: Option<Span>) -> Option<(u32, u32)> {
        let source = self.source?;
        let start = span?.start;
        match self.line_index {
            Some(index) => index.line_col(source, start),
            None => line_col(source, start),
        }
    }

    /// Report a diagnostic warning at the offending node's span.
    pub fn warn(&mut self, span: Span, code: DiagnosticCode, message: impl Into<String>) {
        let message: String = message.into();
        let (line, column) = self.span_position(Some(span)).unzip();
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
        let (line, column) = self.span_position(Some(span)).unzip();
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

    /// Report a userspace-visible warning at the offending node's span.
    /// Unlike `warn`, this pushes the line directly with no session fact,
    /// so the partition keeps it on default (the static/global pattern).
    /// Reserved for static refusals whose author must act without opting
    /// into the compiler channel; dynamic value positions keep the funnel.
    pub fn warn_default(&mut self, span: Span, code: DiagnosticCode, message: impl Into<String>) {
        let message: String = message.into();
        let (line, column) = self.span_position(Some(span)).unzip();
        let location = DiagnosticLocation {
            file: Some(self.file.to_string()),
            line,
            column,
            span: Some(byte_span(span)),
        };
        self.diagnostics.push(location.warning(code, message));
    }

    /// Report an info diagnostic at the offending node's span.
    pub fn info(&mut self, span: Span, code: DiagnosticCode, message: impl Into<String>) {
        let message: String = message.into();
        let (line, column) = self.span_position(Some(span)).unzip();
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

    /// Warn a dynamic refusal in value position, recording its harvest sink.
    /// This is the one sink hook: every Dynamic* call site in value
    /// position funnels through here, so sinks stay exactly the refused
    /// value positions. Non-dynamic codes (a mutated element base) warn
    /// without recording. Spread-position call refusals (object/spread.rs)
    /// are the explicit exception (Slice 3 Q5b): a spread names no prop,
    /// so the refused fragment is not a mintable value position and warns
    /// without a sink — recording one would mint pool values onto a
    /// position the author never refused.
    pub fn warn_dynamic(&mut self, refusal: DynamicRefusal<'_>) {
        let DynamicRefusal {
            span,
            code,
            detail,
            when,
        } = refusal;
        let (line, column) = self.span_position(Some(span)).unzip();
        let mut sink_recorded = false;
        if is_sink_code(code) {
            if let Some(sink) = Sink::for_site(SinkSite {
                prop: self.prop,
                when,
                file: self.file,
                line,
                column,
                span: Some(byte_span(span)),
                backing: self.backing,
            }) {
                self.sinks.push(sink);
                sink_recorded = true;
            }
        }
        let report = ExtractReport {
            location: DiagnosticLocation {
                file: Some(self.file.to_string()),
                line,
                column,
                span: Some(byte_span(span)),
            },
            prop: self.prop.into(),
            when: when.iter().cloned().collect(),
            code,
            detail,
            sink_recorded,
        };
        let diagnostic = Policy::render_extract(&report);
        self.session.report(DiagnosticFact::from(report));
        self.diagnostics.push(diagnostic);
    }
}

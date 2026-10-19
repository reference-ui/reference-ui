//! Diagnostic reporting for the extraction session: located warnings, info, the once-per-file
//! missing-graph error, and the unbacked-package warning, which names the package, its system
//! and the `<package>/baseSystem` fix. Each warning or info lands in two
//! places: the located `Diagnostic` the compile result carries, and a session note that the
//! compiler re-renders with its help text; the two userspace reports push the line alone.
//! Locations come from the span through the file's source text, so a missing source degrades to
//! a file-only location. Takes a span or tag and emits diagnostics; nothing here changes which
//! styles fold.

use oxc_span::Span;
use rustc_hash::FxHashSet;

use crate::diagnostics::adapters::extract::{extract_note, extract_note_with_help};
use crate::diagnostics::{
    byte_span, line_col, Diagnostic, DiagnosticCode, DiagnosticLocation, DiagnosticSeverity,
    DiagnosticSink, Policy,
};

use super::ExtractContext;
use crate::extract::backing::{Unbacked, UnbackedReason};
use crate::extract::bindings;
use crate::extract::package_system::{package_name, PackageTag};
use crate::extract::provenance::{self, TagProvenance};

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

    /// Warn that style props on a tag another package renders will not paint:
    /// that package's runtime mints classes under its own systems, and none of
    /// them is composed here (or its published system cannot be read). Pushed
    /// with no session note: it rides the default channel only.
    pub(crate) fn report_unbacked_external(
        &mut self,
        span: Span,
        tag: &str,
        unbacked: &Unbacked<'_>,
    ) {
        let package = package_name(&unbacked.package.specifier);
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
        let (message, help) = unbacked_text(tag, package, unbacked.reason);
        self.diagnostics.push(Policy::attach_help(
            location.warning(DiagnosticCode::ExternalUnbacked, message),
            vec![help],
        ));
    }

    /// The package a same-file wrapper hands its `css` prop to, when it
    /// threads into no host; an inner rebinding of the tag vetoes it.
    pub(crate) fn css_forward_package(&self, tag: &str) -> Option<&'a PackageTag> {
        if bindings::is_inner_shadowed(self.shadowed, tag) {
            return None;
        }
        self.wrapper_threads?.package_forward(tag)
    }

    /// The package a tag's root ends at, following same-file `const` aliases
    /// (`const Primary = Button`) with a cycle guard, or `None` when the root
    /// is not package-bound.
    pub(crate) fn bound_package(&self, tag: &str) -> Option<&'a PackageTag> {
        let mut current = provenance::tag_root(tag).to_string();
        let mut scope = self.scope;
        let mut seen = FxHashSet::default();
        while seen.insert(current.clone()) {
            let Some((decl, target)) = self.chain.alias_edge(&current, scope) else {
                return match provenance::classify(self.bindings, self.shadowed, &current) {
                    TagProvenance::Package(package) => Some(package),
                    _ => None,
                };
            };
            current = target;
            scope = decl;
        }
        None
    }
}

/// The unbacked warning's message and help. A package whose systems are not
/// composed names its own system and the `<package>/baseSystem` fix; one whose
/// published system cannot be read names the file.
fn unbacked_text(tag: &str, package: &str, reason: UnbackedReason<'_>) -> (String, String) {
    match reason {
        UnbackedReason::NotComposed(names) => (
            format!(
                "style props on <{tag}> will not paint: '{package}' renders through its own system '{}', and no system in `extends` or `layers` backs it",
                names.name
            ),
            format!("add '{package}/baseSystem' to `extends` or `layers` in ui.config"),
        ),
        UnbackedReason::Unreadable(why) => (
            format!(
                "style props on <{tag}> will not paint: the system '{package}' publishes cannot be read ({why})"
            ),
            format!("run `ref sync` in '{package}' and publish the baseSystem it writes"),
        ),
    }
}

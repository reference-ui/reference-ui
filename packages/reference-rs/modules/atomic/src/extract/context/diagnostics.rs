//! Diagnostic reporting for the extraction session: located warnings, info, the once-per-file
//! missing-graph error, and the unbacked-package warning. Each warning or info lands in two
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
use crate::extract::bindings;
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

    /// Warn that style props on a tag the `specifier` package styles may have
    /// nothing to back them. That package's runtime mints classes under its own
    /// system name, which only a composed baseSystem backs. Extraction cannot see
    /// the composed systems, so assembly drops the line once any foreign qualifier
    /// exists. Pushed with no session note: it rides the default channel only.
    pub fn report_unbacked_external(&mut self, span: Span, tag: &str, specifier: &str) {
        let package = package_name(specifier);
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
        let message = format!(
            "style props on <{tag}> will not paint: '{package}' styles it with its own system, and no system in `extends` or `layers` backs it"
        );
        let help = vec![format!(
            "add the '{package}' baseSystem to `extends` or `layers` in ui.config"
        )];
        self.diagnostics.push(Policy::attach_help(
            location.warning(DiagnosticCode::ExternalUnbacked, message),
            help,
        ));
    }

    /// The package a same-file wrapper hands its `css` prop to, when it
    /// threads into no host; an inner rebinding of the tag vetoes it.
    pub(crate) fn css_forward_package(&self, tag: &str) -> Option<&'a str> {
        if bindings::is_inner_shadowed(self.shadowed, tag) {
            return None;
        }
        self.wrapper_threads?.package_forward(tag)
    }

    /// The bare specifier a tag's root ends at, following same-file `const`
    /// aliases (`const Primary = Button`) with a cycle guard, or `None` when
    /// the root is not package-bound.
    pub(crate) fn bound_package(&self, tag: &str) -> Option<&'a str> {
        let mut current = provenance::tag_root(tag).to_string();
        let mut scope = self.scope;
        let mut seen = FxHashSet::default();
        while seen.insert(current.clone()) {
            let Some((decl, target)) = self.chain.alias_edge(&current, scope) else {
                return match provenance::classify(self.bindings, self.shadowed, &current) {
                    TagProvenance::Package(specifier) => Some(specifier),
                    _ => None,
                };
            };
            current = target;
            scope = decl;
        }
        None
    }
}

/// The npm package a bare specifier names, without its subpath:
/// `@reference-ui/lib/primitives` is `@reference-ui/lib`, `acme-ui/button` is `acme-ui`.
fn package_name(specifier: &str) -> &str {
    let slashes = if specifier.starts_with('@') { 2 } else { 1 };
    match specifier.match_indices('/').nth(slashes - 1) {
        Some((end, _)) => &specifier[..end],
        None => specifier,
    }
}

#[cfg(test)]
mod tests {
    use super::package_name;

    #[test]
    fn package_name_drops_the_subpath_only() {
        assert_eq!(
            package_name("@reference-ui/lib/primitives"),
            "@reference-ui/lib"
        );
        assert_eq!(package_name("@reference-ui/icons"), "@reference-ui/icons");
        assert_eq!(package_name("acme-ui/button"), "acme-ui");
        assert_eq!(package_name("acme-ui"), "acme-ui");
    }
}

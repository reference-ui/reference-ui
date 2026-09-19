//! Source and site identity for compiler diagnostics, plus owned locations.
//!
//! A [`SourceSite`] names one author position (source id, span, surface,
//! property, conditions) without borrowing AST or phase state, so facts can
//! outlive the pass that reported them. [`DiagnosticLocation`] is the owned
//! file/line/column form rendered on the wire; [`line_col`] resolves byte
//! offsets to 1-based UTF-16 positions matching editor carets.

use oxc_span::Span;
use serde::{Deserialize, Serialize};

use super::{Diagnostic, DiagnosticCode};

/// Opaque identity for one compile input within a [`DiagnosticsSession`](super::DiagnosticsSession).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct SourceId(pub u32);

/// The authored surface a diagnostic site belongs to. Policy needs the site,
/// not just the code: one legacy code can be userspace on one surface and
/// compiler-only on another (ledger "one code, two verdicts").
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum StyleSurfaceKind {
    /// Imported `css()` style objects.
    Css,
    /// Traced JSX style props and JSX `css` objects.
    JsxStyle,
    /// `BaseSystem.static_css` entries.
    StaticCss,
    /// `BaseSystem.global_css` fragments.
    GlobalCss,
    /// `recipe()` tables (spec or extracted).
    Recipe,
    /// StyleTrace host discovery.
    Host,
}

/// One author location that can carry facts. Owns its data (`SourceId` plus a
/// copyable span); it never retains an Oxc node or borrows a phase context.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SourceSite {
    pub source: SourceId,
    pub span: Span,
    pub surface: StyleSurfaceKind,
    pub prop: Box<str>,
    pub when: Vec<Box<str>>,
}

/// File/line/column carried from extract to resolve for located diagnostics.
/// Extract populates it from literal spans; resolve attaches it to warnings
/// and errors. Empty when the want was synthesized rather than authored in
/// source (harvest, static CSS, plan rebuilds), in which case the diagnostic
/// stays unlocated exactly as before.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct DiagnosticLocation {
    pub file: Option<String>,
    pub line: Option<u32>,
    pub column: Option<u32>,
}

impl DiagnosticLocation {
    /// Build an error diagnostic carrying this location, when known.
    pub fn error(&self, code: DiagnosticCode, message: impl Into<String>) -> Diagnostic {
        self.with_severity(Diagnostic::error(code, message))
    }

    /// Build a warning diagnostic carrying this location, when known.
    pub fn warning(&self, code: DiagnosticCode, message: impl Into<String>) -> Diagnostic {
        self.with_severity(Diagnostic::warning(code, message))
    }

    /// Build an info diagnostic carrying this location, when known.
    pub fn info(&self, code: DiagnosticCode, message: impl Into<String>) -> Diagnostic {
        self.with_severity(Diagnostic::info(code, message))
    }

    fn with_severity(&self, mut diagnostic: Diagnostic) -> Diagnostic {
        if let Some(file) = &self.file {
            diagnostic.file = Some(file.clone());
            diagnostic.line = self.line;
            diagnostic.column = self.column;
        }
        diagnostic
    }
}

/// 1-based (line, column) for a byte offset, or None past the end.
/// Columns count UTF-16 code units so positions match editor carets.
pub fn line_col(source: &str, offset: u32) -> Option<(u32, u32)> {
    let prefix = source.get(..offset as usize)?;
    let line = prefix.bytes().filter(|byte| *byte == b'\n').count() as u32 + 1;
    let tail = prefix.rsplit('\n').next().unwrap_or(prefix);
    let column = tail.chars().map(|ch| ch.len_utf16() as u32).sum::<u32>() + 1;
    Some((line, column))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::diagnostics::DiagnosticSeverity;

    #[test]
    fn line_col_counts_from_one() {
        assert_eq!(line_col("ab\ncd", 0), Some((1, 1)));
        assert_eq!(line_col("ab\ncd", 3), Some((2, 1)));
        assert_eq!(line_col("ab\ncd", 4), Some((2, 2)));
    }

    #[test]
    fn line_col_counts_columns_in_utf16_units() {
        assert_eq!(line_col("a😀b", 5), Some((1, 4)));
    }

    #[test]
    fn line_col_rejects_offsets_past_the_end() {
        assert_eq!(line_col("ab", 3), None);
    }

    #[test]
    fn located_error_carries_file_and_position() {
        let loc = DiagnosticLocation {
            file: Some("a.tsx".to_string()),
            line: Some(4),
            column: Some(12),
        };
        let diagnostic = loc.error(
            DiagnosticCode::UnknownTokenReference,
            "unknown token reference `{colors.nope}`",
        );
        assert_eq!(diagnostic.severity, DiagnosticSeverity::Error);
        assert_eq!(diagnostic.code, DiagnosticCode::UnknownTokenReference);
        assert_eq!(diagnostic.file.as_deref(), Some("a.tsx"));
        assert_eq!(diagnostic.line, Some(4));
        assert_eq!(diagnostic.column, Some(12));
    }

    #[test]
    fn located_warning_carries_file_and_position() {
        let loc = DiagnosticLocation {
            file: Some("located.ts".to_string()),
            line: Some(5),
            column: Some(15),
        };
        let diagnostic = loc.warning(DiagnosticCode::UnknownTokenPath, "unknown token path `x.y`");
        assert_eq!(diagnostic.severity, DiagnosticSeverity::Warning);
        assert_eq!(diagnostic.file.as_deref(), Some("located.ts"));
        assert_eq!(diagnostic.line, Some(5));
        assert_eq!(diagnostic.column, Some(15));
    }

    #[test]
    fn empty_location_warns_without_position() {
        let diagnostic = DiagnosticLocation::default().warning(
            DiagnosticCode::UnknownCondition,
            "unknown condition `_nope`",
        );
        assert_eq!(diagnostic.file, None);
        assert_eq!(diagnostic.line, None);
        assert_eq!(diagnostic.column, None);
    }

    #[test]
    fn empty_location_errors_without_position() {
        let diagnostic = DiagnosticLocation::default().error(DiagnosticCode::ParseError, "boom");
        assert_eq!(diagnostic.file, None);
        assert_eq!(diagnostic.line, None);
    }

    #[test]
    fn source_site_owns_no_borrows() {
        let site = SourceSite {
            source: SourceId(7),
            span: Span::new(10, 20),
            surface: StyleSurfaceKind::Css,
            prop: "color".into(),
            when: vec!["md".into()],
        };
        assert_eq!(site.source, SourceId(7));
        assert_eq!(site.surface, StyleSurfaceKind::Css);
        assert_eq!(site.span.start, 10);
    }
}

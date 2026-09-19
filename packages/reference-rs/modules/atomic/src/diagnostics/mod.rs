//! Compiler diagnostic definitions and severity reporting for Reference UI.
//! Formats errors, warnings, and informational notices with source locations during extraction and resolution.
//! Enforces fail-closed compilation semantics to surface invalid styling patterns early.
//! Every diagnostic carries a stable [`DiagnosticCode`] so hosts can filter by
//! failure class, and renders through [`render`] as `{file}:{line}:{col} {code} {message}`.

use serde::{Deserialize, Serialize};

mod codes;
mod render;

pub use codes::DiagnosticCode;
pub use render::render;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DiagnosticSeverity {
    Error,
    Warning,
    Info,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Diagnostic {
    pub severity: DiagnosticSeverity,
    pub code: DiagnosticCode,
    pub message: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub file: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub line: Option<u32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub column: Option<u32>,
}

/// File/line/column carried from extract to resolve for located diagnostics.
/// Extract populates it from literal spans; resolve attaches it to errors.
/// Empty when the want was synthesized rather than authored in source.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct DiagnosticLocation {
    pub file: Option<String>,
    pub line: Option<u32>,
    pub column: Option<u32>,
}

impl DiagnosticLocation {
    /// Build an error diagnostic carrying this location, when known.
    pub fn error(&self, code: DiagnosticCode, message: impl Into<String>) -> Diagnostic {
        let mut diagnostic = Diagnostic::error(code, message);
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

impl Diagnostic {
    pub fn error(code: DiagnosticCode, message: impl Into<String>) -> Self {
        Self {
            severity: DiagnosticSeverity::Error,
            code,
            message: message.into(),
            file: None,
            line: None,
            column: None,
        }
    }

    pub fn warning(code: DiagnosticCode, message: impl Into<String>) -> Self {
        Self {
            severity: DiagnosticSeverity::Warning,
            code,
            message: message.into(),
            file: None,
            line: None,
            column: None,
        }
    }

    pub fn info(code: DiagnosticCode, message: impl Into<String>) -> Self {
        Self {
            severity: DiagnosticSeverity::Info,
            code,
            message: message.into(),
            file: None,
            line: None,
            column: None,
        }
    }

    pub fn with_location(
        mut self,
        file: impl Into<String>,
        line: Option<u32>,
        column: Option<u32>,
    ) -> Self {
        self.file = Some(file.into());
        self.line = line;
        self.column = column;
        self
    }
}

#[cfg(test)]
mod tests {
    use super::*;

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
    fn empty_location_errors_without_position() {
        let diagnostic = DiagnosticLocation::default().error(DiagnosticCode::ParseError, "boom");
        assert_eq!(diagnostic.file, None);
        assert_eq!(diagnostic.line, None);
    }
}

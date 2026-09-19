//! One-line rendering for compiler diagnostics.
//!
//! Every diagnostic prints as `{file}:{line}:{col} {code} {message}` so an
//! author can jump to the sub-expression that stopped extraction and tooling
//! can filter by kind. The CLI, Neo, and the station specs share this format
//! instead of each inventing a layout. Diagnostics without a position omit
//! the location segments rather than printing placeholders.

use std::fmt::Write as _;

use super::Diagnostic;

/// Render a diagnostic as `{file}:{line}:{col} {code} {message}`.
///
/// Unlocated diagnostics print just `{code} {message}`; file-only ones print
/// `{file} {code} {message}`. The code always separates location from text.
pub fn render(diagnostic: &Diagnostic) -> String {
    let mut out = String::new();
    if let Some(file) = diagnostic.file.as_deref() {
        out.push_str(file);
        if let (Some(line), Some(column)) = (diagnostic.line, diagnostic.column) {
            let _ = write!(out, ":{line}:{column}");
        }
        out.push(' ');
    }
    let _ = write!(out, "{} {}", diagnostic.code, diagnostic.message);
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::diagnostics::{DiagnosticCode, DiagnosticSeverity};

    fn located() -> Diagnostic {
        Diagnostic {
            severity: DiagnosticSeverity::Warning,
            code: DiagnosticCode::DynamicMember,
            message: "dynamic member expression for prop 'color'".to_string(),
            file: Some("test.tsx".to_string()),
            line: Some(3),
            column: Some(18),
        }
    }

    #[test]
    fn located_diagnostic_renders_position_code_message() {
        assert_eq!(
            render(&located()),
            "test.tsx:3:18 ATM-W-DYNAMIC-MEMBER dynamic member expression for prop 'color'"
        );
    }

    #[test]
    fn file_only_diagnostic_omits_position() {
        let mut diagnostic = located();
        diagnostic.line = None;
        diagnostic.column = None;
        assert_eq!(
            render(&diagnostic),
            "test.tsx ATM-W-DYNAMIC-MEMBER dynamic member expression for prop 'color'"
        );
    }

    #[test]
    fn unlocated_diagnostic_prints_code_and_message() {
        let mut diagnostic = located();
        diagnostic.file = None;
        diagnostic.line = None;
        diagnostic.column = None;
        assert_eq!(
            render(&diagnostic),
            "ATM-W-DYNAMIC-MEMBER dynamic member expression for prop 'color'"
        );
    }
}

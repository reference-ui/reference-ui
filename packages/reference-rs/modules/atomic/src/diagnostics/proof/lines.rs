//! Pushed-line surgery for proof verdicts: find and remove by identity.
//!
//! Proof matches legacy lines by re-derived identity (code, location, and
//! message), never by position, so verdicts land on the exact line their
//! fact pushed even as other phases reorder around them. Replacements swap
//! the message through the finder; removals drop the first identity match.

use super::super::{Diagnostic, DiagnosticCode, DiagnosticLocation};

/// The first pushed line matching code, location, and message, if any.
pub fn find_line<'d>(
    diagnostics: &'d mut Vec<Diagnostic>,
    code: DiagnosticCode,
    location: &DiagnosticLocation,
    message: &str,
) -> Option<&'d mut Diagnostic> {
    diagnostics.iter_mut().find(|line| {
        line.code == code
            && line.file == location.file
            && line.line == location.line
            && line.column == location.column
            && line.message == message
    })
}

/// Drop the first pushed line matching code, location, and message.
pub fn remove_line(
    diagnostics: &mut Vec<Diagnostic>,
    code: DiagnosticCode,
    location: &DiagnosticLocation,
    message: &str,
) {
    if let Some(index) = diagnostics.iter().position(|line| {
        line.code == code
            && line.file == location.file
            && line.line == location.line
            && line.column == location.column
            && line.message == message
    }) {
        diagnostics.remove(index);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn located() -> DiagnosticLocation {
        DiagnosticLocation {
            file: Some("t.ts".to_string()),
            line: Some(4),
            column: Some(19),
        }
    }

    fn lines() -> Vec<Diagnostic> {
        vec![
            located().warning(DiagnosticCode::UnknownCondition, "first"),
            located().warning(DiagnosticCode::UnknownCondition, "second"),
        ]
    }

    #[test]
    fn identity_matches_code_location_and_message() {
        let mut diagnostics = lines();
        let found = find_line(
            &mut diagnostics,
            DiagnosticCode::UnknownCondition,
            &located(),
            "second",
        );
        assert_eq!(found.map(|line| line.message.as_str()), Some("second"));
        assert!(
            find_line(
                &mut diagnostics,
                DiagnosticCode::UnknownCondition,
                &located(),
                "nope",
            )
            .is_none()
        );
    }

    #[test]
    fn removal_drops_the_first_identity_match_only() {
        let mut diagnostics = lines();
        remove_line(
            &mut diagnostics,
            DiagnosticCode::UnknownCondition,
            &located(),
            "first",
        );
        assert_eq!(diagnostics.len(), 1);
        assert_eq!(diagnostics[0].message, "second");
    }
}

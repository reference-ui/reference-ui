//! Styletrace diagnostics: the module's typed failure vocabulary rooted in the shared template.
//! Producers mint `STT-W-*` / `STT-E-*` codes from [`codes::StyletraceDiagnosticCode`] and emit the
//! template [`Diagnostic`] values every consumer already parses, so styletrace failures filter, group,
//! and document by code instead of string matching. Outcome diagnostics are warnings only; both error
//! classes refuse the request as coded throws, mirroring the tasty scan channel. Skip sentences preserve
//! the legacy `StyleTrace: …` prose the atomic goldens pin, byte-identical, while the code and the file
//! envelope carry the new structure.

mod codes;

pub use codes::StyletraceDiagnosticCode;
pub use diagnostics::{Diagnostic, DiagnosticError};

/// Styletrace diagnostics are template diagnostics: severity plus validated code plus message.
/// No sibling shape — the submodule owns the vocabulary, the template owns the representation.
pub type StyletraceDiagnostic = Diagnostic;

/// One skipped file: the entry or edge target failed to parse or read, so it contributes
/// no hosts while its siblings still trace. `message` is the legacy skip sentence, kept
/// byte-identical for the atomic goldens; the envelope carries the file. The unlocated
/// variant covers the defensive residual, where the walk degraded instead of one file.
pub(crate) fn skipped_file(
    file: Option<&str>,
    message: String,
) -> Result<Diagnostic, DiagnosticError> {
    let mut diagnostic =
        Diagnostic::warning(StyletraceDiagnosticCode::SkippedFile.as_str(), message)?;
    if let Some(file) = file {
        diagnostic = diagnostic.with_location(file, None, None);
    }
    Ok(diagnostic)
}

/// Record one skip into an outcome. Construction is infallible in practice — the code is a
/// hardcoded-valid constant and legacy skip sentences are never blank — so an unreachable
/// build failure drops the note rather than failing traced siblings; the bindings stay
/// the honest signal. The trace fns return outcomes, not results, so producers cannot
/// propagate like the request-level errors below.
pub(crate) fn push_skipped(diagnostics: &mut Vec<Diagnostic>, file: Option<&str>, message: String) {
    if let Ok(diagnostic) = skipped_file(file, message) {
        diagnostics.push(diagnostic);
    }
}

/// Scan refusal prefix: discovery or read failed, so the request is refused wholesale.
/// Surfaces as a coded throw carrying `STT-E-SCAN-FAILED` rather than a diagnostics entry.
pub(crate) fn scan_failed(reason: impl Into<String>) -> String {
    format!(
        "{}: {}",
        StyletraceDiagnosticCode::ScanFailed.as_str(),
        reason.into()
    )
}

/// Surface refusal prefix: no sync root, StyleProps entrypoint, or primitives surface, so the
/// request is refused wholesale. Surfaces as a coded throw carrying `STT-E-UNRESOLVED-SURFACE`.
pub(crate) fn unresolved_surface(reason: impl Into<String>) -> String {
    format!(
        "{}: {}",
        StyletraceDiagnosticCode::UnresolvedSurface.as_str(),
        reason.into()
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use diagnostics::Severity;

    #[test]
    fn constructors_emit_located_warnings_with_stable_codes() {
        let skipped = skipped_file(
            Some("input/broken.ts"),
            "StyleTrace: failed to parse input/broken.ts: 1 parse error(s)".to_string(),
        )
        .unwrap();
        assert_eq!(skipped.code.as_str(), "STT-W-SKIPPED-FILE");
        assert_eq!(skipped.severity, Severity::Warning);
        assert_eq!(skipped.file.as_deref(), Some("input/broken.ts"));
        assert!(skipped.message.contains("parse error"));

        let residual = skipped_file(None, "StyleTrace: walk degraded".to_string()).unwrap();
        assert_eq!(residual.code.as_str(), "STT-W-SKIPPED-FILE");
        assert_eq!(residual.severity, Severity::Warning);
        assert!(residual.file.is_none());
    }

    #[test]
    fn skipped_file_pins_exact_wire_bytes() {
        let skipped = skipped_file(
            Some("input/broken.ts"),
            "StyleTrace: failed to parse input/broken.ts: 1 parse error(s)".to_string(),
        )
        .unwrap();
        assert_eq!(
            serde_json::to_string(&skipped).unwrap(),
            "{\"severity\":\"warning\",\"code\":\"STT-W-SKIPPED-FILE\",\
             \"message\":\"StyleTrace: failed to parse input/broken.ts: 1 parse error(s)\",\
             \"file\":\"input/broken.ts\"}"
        );
    }

    #[test]
    fn push_skipped_records_one_note_per_call() {
        let mut diagnostics = Vec::new();
        push_skipped(
            &mut diagnostics,
            Some("input/broken.ts"),
            "StyleTrace: failed to parse input/broken.ts: 1 parse error(s)".to_string(),
        );
        push_skipped(
            &mut diagnostics,
            None,
            "StyleTrace: walk degraded".to_string(),
        );
        assert_eq!(diagnostics.len(), 2);
        assert!(diagnostics
            .iter()
            .all(|note| note.severity == Severity::Warning));
    }

    #[test]
    fn scan_and_surface_failures_carry_error_code_prefixes() {
        let scan = scan_failed("failed to read /src: gone");
        assert_eq!(scan, "STT-E-SCAN-FAILED: failed to read /src: gone");
        let surface = unresolved_surface("missing StyleProps declaration entrypoint in `/decl`");
        assert_eq!(
            surface,
            "STT-E-UNRESOLVED-SURFACE: missing StyleProps declaration entrypoint in `/decl`"
        );
        for (text, code) in [
            ("STT-E-SCAN-FAILED", StyletraceDiagnosticCode::ScanFailed),
            (
                "STT-E-UNRESOLVED-SURFACE",
                StyletraceDiagnosticCode::UnresolvedSurface,
            ),
        ] {
            assert_eq!(text.parse(), Ok(code));
            let parsed = diagnostics::DiagnosticCode::parse(text).unwrap();
            assert!(parsed.is_error_code());
        }
    }
}

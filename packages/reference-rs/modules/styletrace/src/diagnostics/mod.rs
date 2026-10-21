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

use std::path::Path;

use crate::resolver::{CutReason, GuardCut};

/// Styletrace diagnostics are template diagnostics: severity plus validated code plus message.
/// No sibling shape — the submodule owns the vocabulary, the template owns the representation.
pub type StyletraceDiagnostic = Diagnostic;

/// One skipped file: the entry or edge target failed to parse or read, so it contributes
/// no hosts while its siblings still trace. `message` is the legacy skip sentence, kept
/// byte-identical for the atomic goldens; the envelope carries the file. The unlocated
/// variant covers the defensive residual, where the walk degraded instead of one file.
/// Carries no engine help: classifying parse-vs-read from the message is brittle,
/// so the static hint wins and the bytes stay identical.
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

/// Class-component warning: a class whose props expose StyleProps is not traced in v1, so its
/// style props are not traced either. Names the class and its file; the trace keeps going.
pub(crate) fn class_component(file: &str, name: &str) -> Option<StyletraceDiagnostic> {
    located_warning(
        StyletraceDiagnosticCode::ClassComponent,
        file,
        format!("StyleTrace: class component `{name}` is not traced; its style props are not traced"),
    )
}

/// Unresolved higher-order argument: `binding` is initialized by `hoc`, which forwards style props
/// into argument `index` (zero-based), but that argument names no component. The binding stays
/// untraced rather than guessed.
pub(crate) fn unresolved_hoc_argument(
    file: &str,
    binding: &str,
    hoc: &str,
    index: usize,
) -> Option<StyletraceDiagnostic> {
    located_warning(
        StyletraceDiagnosticCode::UnresolvedHocArgument,
        file,
        format!(
            "StyleTrace: `{binding}` is not traced: `{hoc}` forwards style props into argument {}, which names no component",
            index + 1
        ),
    )
}

/// Type-expansion warning: the trace stopped expanding `cut.name`, declared in `cut.module`, at a guard
/// limit, so the props that expansion would add are not traced. Located at `file`, the module whose
/// props type was being traced, since that is where the chain can be shortened; the trace keeps going.
pub(crate) fn type_expansion_limit(file: &str, cut: &GuardCut) -> Option<StyletraceDiagnostic> {
    located_warning(
        StyletraceDiagnosticCode::TypeExpansionLimit,
        file,
        format!(
            "StyleTrace: stopped expanding `{}` in {} at the {} limit; props it would add are not traced",
            cut.name,
            cut.module.display(),
            limit_word(cut.reason),
        ),
    )
}

/// Reason text for a surface whose entry lost names to a guard limit: the declaration the limit refused,
/// the module that declares it and the limit it hit. The caller prefixes the code, as for every surface refusal.
pub(crate) fn surface_cut(entry: &Path, export_name: &str, cut: &GuardCut) -> String {
    format!(
        "{export_name} in {} is incomplete: expanding `{}` in {} stopped at the {} limit, so the props it would add are missing",
        entry.display(),
        cut.name,
        cut.module.display(),
        limit_word(cut.reason),
    )
}

/// The limit as the warning names it: the depth cap, the argument-size cap or the session budget.
fn limit_word(reason: CutReason) -> &'static str {
    match reason {
        CutReason::Depth => "depth",
        CutReason::Argument => "argument",
        CutReason::Budget => "budget",
    }
}

/// A located warning with a stable code. Both callers pass non-blank messages, so construction
/// cannot fail in practice; an unreachable failure drops the note, as `push_skipped` does.
fn located_warning(
    code: StyletraceDiagnosticCode,
    file: &str,
    message: String,
) -> Option<StyletraceDiagnostic> {
    let diagnostic = Diagnostic::warning(code.as_str(), message).ok()?;
    Some(diagnostic.with_location(file, None, None))
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
        assert!(skipped.help.is_none());

        let residual = skipped_file(None, "StyleTrace: walk degraded".to_string()).unwrap();
        assert_eq!(residual.code.as_str(), "STT-W-SKIPPED-FILE");
        assert_eq!(residual.severity, Severity::Warning);
        assert!(residual.file.is_none());
        assert!(residual.help.is_none());
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
    fn class_and_hoc_warnings_pin_codes_and_location() {
        let class = class_component("/src/index.tsx", "Card").unwrap();
        assert_eq!(class.code.as_str(), "STT-W-CLASS-COMPONENT");
        assert_eq!(class.severity, Severity::Warning);
        assert_eq!(class.file.as_deref(), Some("/src/index.tsx"));
        assert!(class.message.contains("`Card`"));
        assert!(class.message.ends_with("its style props are not traced"));

        let hoc = unresolved_hoc_argument("/src/index.tsx", "Fancy", "withPad", 0).unwrap();
        assert_eq!(hoc.code.as_str(), "STT-W-UNRESOLVED-HOC-ARGUMENT");
        assert_eq!(hoc.severity, Severity::Warning);
        assert!(hoc.message.contains("argument 1"));
        assert!(hoc.message.contains("`withPad`"));
    }

    #[test]
    fn class_and_hoc_warnings_pin_wire_bytes() {
        let class = class_component("/src/index.tsx", "Card").unwrap();
        assert_eq!(
            serde_json::to_string(&class).unwrap(),
            "{\"severity\":\"warning\",\"code\":\"STT-W-CLASS-COMPONENT\",\
             \"message\":\"StyleTrace: class component `Card` is not traced; its style props are not traced\",\
             \"file\":\"/src/index.tsx\"}"
        );
        let hoc = unresolved_hoc_argument("/src/index.tsx", "Fancy", "withPad", 0).unwrap();
        assert_eq!(
            serde_json::to_string(&hoc).unwrap(),
            "{\"severity\":\"warning\",\"code\":\"STT-W-UNRESOLVED-HOC-ARGUMENT\",\
             \"message\":\"StyleTrace: `Fancy` is not traced: `withPad` forwards style props into argument 1, which names no component\",\
             \"file\":\"/src/index.tsx\"}"
        );
    }

    #[test]
    fn type_expansion_limit_pins_code_location_and_message() {
        let cut = GuardCut {
            reason: CutReason::Depth,
            name: "StyleProps".to_string(),
            module: std::path::PathBuf::from("/sync/style-props.d.mts"),
        };
        let warning = type_expansion_limit("/src/chain.tsx", &cut).unwrap();
        assert_eq!(warning.code.as_str(), "STT-W-TYPE-EXPANSION-LIMIT");
        assert_eq!(warning.severity, Severity::Warning);
        assert_eq!(warning.file.as_deref(), Some("/src/chain.tsx"));
        assert_eq!(
            warning.message,
            "StyleTrace: stopped expanding `StyleProps` in /sync/style-props.d.mts at the depth limit; props it would add are not traced"
        );
        assert_eq!(
            serde_json::to_string(&warning).unwrap(),
            "{\"severity\":\"warning\",\"code\":\"STT-W-TYPE-EXPANSION-LIMIT\",\
             \"message\":\"StyleTrace: stopped expanding `StyleProps` in /sync/style-props.d.mts at the depth limit; props it would add are not traced\",\
             \"file\":\"/src/chain.tsx\"}"
        );
        for (reason, word) in [
            (CutReason::Argument, "argument"),
            (CutReason::Budget, "budget"),
        ] {
            let limited = GuardCut {
                reason,
                ..cut.clone()
            };
            let warning = type_expansion_limit("/src/chain.tsx", &limited).unwrap();
            assert!(warning.message.contains(&format!("at the {word} limit")));
        }
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

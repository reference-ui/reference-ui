//! Tasty diagnostics: the module's typed failure vocabulary rooted in the shared template.
//! Producers mint `TST-W-*` / `TST-E-*` codes from [`codes::TastyDiagnosticCode`] and emit the
//! template [`Diagnostic`] values every consumer already parses, so tasty failures filter, group,
//! and document by code instead of string matching. Messages follow the subject-first pattern with
//! backticked subjects; the file envelope carries the source path while the message stays greppable.

mod codes;

pub use codes::TastyDiagnosticCode;
pub use diagnostics::{Diagnostic, DiagnosticError};

/// Tasty diagnostics are template diagnostics: severity plus validated code plus message.
/// No sibling shape — the submodule owns the vocabulary, the template owns the representation.
pub type TastyDiagnostic = Diagnostic;

/// Parse failure in one file: Oxc reported errors, extraction keeps the recoverable shells.
/// Carries no engine help: file and count already sit in the message, so the static hint wins.
pub(crate) fn parse_error(file_id: &str, error_count: usize) -> Result<Diagnostic, DiagnosticError> {
    Ok(Diagnostic::warning(
        TastyDiagnosticCode::ParseError.as_str(),
        format!("parse reported {error_count} error(s); keeping the recoverable declarations"),
    )?
    .with_location(file_id, None, None))
}

/// Same-file same-name alias or mixed group: keeps the last shell, `kinds` names the pair.
pub(crate) fn duplicate_declaration(
    file_id: &str,
    name: &str,
    kinds: &str,
) -> Result<Diagnostic, DiagnosticError> {
    Diagnostic::warning(
        TastyDiagnosticCode::DuplicateDeclaration.as_str(),
        format!("duplicate declaration of `{name}` ({kinds}); keeping the last"),
    )?
    .with_location(file_id, None, None)
    .with_help(vec![format!(
        "merge the duplicate `{name}` ({kinds}) or rename one"
    )])
}

/// Merged interfaces declare one nominal member twice: keeps the first occurrence.
pub(crate) fn duplicate_member(
    file_id: &str,
    interface: &str,
    member: &str,
) -> Result<Diagnostic, DiagnosticError> {
    Diagnostic::warning(
        TastyDiagnosticCode::DuplicateMember.as_str(),
        format!("interface `{interface}` declares member `{member}` more than once; keeping the first"),
    )?
    .with_location(file_id, None, None)
    .with_help(vec![format!(
        "remove the duplicate `{member}` from interface `{interface}` or rename one"
    )])
}

/// `export *` ambiguity in one barrel: two targets provide the name, ESM absence wins.
pub(crate) fn star_ambiguity(
    barrel: &str,
    name: &str,
    first_source: &str,
    second_source: &str,
) -> Result<Diagnostic, DiagnosticError> {
    Diagnostic::warning(
        TastyDiagnosticCode::StarAmbiguity.as_str(),
        format!(
            "export * ambiguity: `{name}` in `{barrel}` is provided by both `{first_source}` and `{second_source}`; excluding from barrel exports"
        ),
    )?
    .with_location(barrel, None, None)
    .with_help(vec![format!(
        "re-export `{name}` explicitly from `{barrel}`"
    )])
}

/// One name indexes several symbols: `matches` lists `id (library)` pairs for disambiguation.
pub(crate) fn duplicate_symbol_name(
    name: &str,
    entry_count: usize,
    matches: &str,
) -> Result<Diagnostic, DiagnosticError> {
    Diagnostic::warning(
        TastyDiagnosticCode::DuplicateSymbolName.as_str(),
        format!(
            "Duplicate symbol name `{name}` matched {entry_count} entries: {matches}. Use symbol id or scoped lookup to disambiguate."
        ),
    )?
    .with_help(vec![format!(
        "look up `{name}` by symbol id ({matches}) or a scoped lookup"
    )])
}

/// Scan refusal prefix: walk, glob, normalize, and read failures abort the request wholesale,
/// so they surface as a coded throw carrying `TST-E-SCAN-FAILED` rather than a diagnostics entry.
pub(crate) fn scan_failed(reason: impl Into<String>) -> String {
    format!("{}: {}", TastyDiagnosticCode::ScanFailed.as_str(), reason.into())
}

#[cfg(test)]
mod tests {
    use super::*;
    use diagnostics::Severity;

    #[test]
    fn constructors_emit_located_warnings_with_stable_codes() {
        let parsed = parse_error("src/broken.ts", 2).unwrap();
        assert_eq!(parsed.code.as_str(), "TST-W-PARSE-ERROR");
        assert_eq!(parsed.severity, Severity::Warning);
        assert_eq!(parsed.file.as_deref(), Some("src/broken.ts"));
        assert!(parsed.message.contains("parse reported 2 error(s)"));
        assert!(parsed.help.is_none());

        let declaration =
            duplicate_declaration("src/dup.ts", "Dup", "TypeAlias + TypeAlias").unwrap();
        assert_eq!(declaration.code.as_str(), "TST-W-DUPLICATE-DECLARATION");
        assert!(declaration.message.contains("`Dup`"));
        assert_eq!(
            declaration.help,
            Some(vec![
                "merge the duplicate `Dup` (TypeAlias + TypeAlias) or rename one".to_string()
            ])
        );

        let member = duplicate_member("src/widgets.ts", "Widget", "alpha").unwrap();
        assert_eq!(member.code.as_str(), "TST-W-DUPLICATE-MEMBER");
        assert!(member.message.contains("`alpha`"));
        assert_eq!(
            member.help,
            Some(vec![
                "remove the duplicate `alpha` from interface `Widget` or rename one".to_string()
            ])
        );

        let ambiguous = star_ambiguity("src/barrel.ts", "Widget", "src/a.ts", "src/b.ts").unwrap();
        assert_eq!(ambiguous.code.as_str(), "TST-W-STAR-AMBIGUITY");
        assert!(ambiguous.message.contains("excluding from barrel exports"));
        assert_eq!(
            ambiguous.help,
            Some(vec![
                "re-export `Widget` explicitly from `src/barrel.ts`".to_string()
            ])
        );

        let symbol = duplicate_symbol_name("Shared", 2, "_aaa (user), _bbb (user)").unwrap();
        assert_eq!(symbol.code.as_str(), "TST-W-DUPLICATE-SYMBOL-NAME");
        assert!(symbol.file.is_none());
        assert_eq!(
            symbol.help,
            Some(vec![
                "look up `Shared` by symbol id (_aaa (user), _bbb (user)) or a scoped lookup"
                    .to_string()
            ])
        );
    }

    #[test]
    fn every_warning_pins_its_exact_wire_bytes() {
        let cases = [
            (
                parse_error("src/broken.ts", 2).unwrap(),
                "{\"severity\":\"warning\",\"code\":\"TST-W-PARSE-ERROR\",\
                 \"message\":\"parse reported 2 error(s); keeping the recoverable declarations\",\
                 \"file\":\"src/broken.ts\"}",
            ),
            (
                duplicate_declaration("src/dup.ts", "Dup", "TypeAlias + TypeAlias").unwrap(),
                "{\"severity\":\"warning\",\"code\":\"TST-W-DUPLICATE-DECLARATION\",\
                 \"message\":\"duplicate declaration of `Dup` (TypeAlias + TypeAlias); keeping the last\",\
                 \"file\":\"src/dup.ts\",\
                 \"help\":[\"merge the duplicate `Dup` (TypeAlias + TypeAlias) or rename one\"]}",
            ),
            (
                duplicate_member("src/widgets.ts", "Widget", "alpha").unwrap(),
                "{\"severity\":\"warning\",\"code\":\"TST-W-DUPLICATE-MEMBER\",\
                 \"message\":\"interface `Widget` declares member `alpha` more than once; keeping the first\",\
                 \"file\":\"src/widgets.ts\",\
                 \"help\":[\"remove the duplicate `alpha` from interface `Widget` or rename one\"]}",
            ),
            (
                star_ambiguity("src/barrel.ts", "Widget", "src/a.ts", "src/b.ts").unwrap(),
                "{\"severity\":\"warning\",\"code\":\"TST-W-STAR-AMBIGUITY\",\
                 \"message\":\"export * ambiguity: `Widget` in `src/barrel.ts` is provided by both `src/a.ts` and `src/b.ts`; excluding from barrel exports\",\
                 \"file\":\"src/barrel.ts\",\
                 \"help\":[\"re-export `Widget` explicitly from `src/barrel.ts`\"]}",
            ),
            (
                duplicate_symbol_name("Shared", 2, "_aaa (user), _bbb (user)").unwrap(),
                "{\"severity\":\"warning\",\"code\":\"TST-W-DUPLICATE-SYMBOL-NAME\",\
                 \"message\":\"Duplicate symbol name `Shared` matched 2 entries: _aaa (user), _bbb (user). Use symbol id or scoped lookup to disambiguate.\",\
                 \"help\":[\"look up `Shared` by symbol id (_aaa (user), _bbb (user)) or a scoped lookup\"]}",
            ),
        ];
        for (diagnostic, wire) in cases {
            assert_eq!(serde_json::to_string(&diagnostic).unwrap(), wire);
        }
    }

    #[test]
    fn scan_failures_carry_the_error_code_prefix() {
        let message = scan_failed("failed to walk scan root: gone");
        assert!(message.starts_with("TST-E-SCAN-FAILED: "));
        let code: TastyDiagnosticCode = "TST-E-SCAN-FAILED".parse().unwrap();
        assert_eq!(code, TastyDiagnosticCode::ScanFailed);
    }
}

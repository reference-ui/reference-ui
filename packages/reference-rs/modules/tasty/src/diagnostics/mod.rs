//! Tasty diagnostics: the module's typed failure vocabulary rooted in the shared template.
//! Producers mint `TST-W-*` / `TST-E-*` codes from [`codes::TastyDiagnosticCode`] and emit the
//! template [`Diagnostic`] values every consumer already parses, so tasty failures filter, group,
//! and document by code instead of string matching. Messages follow the subject-first pattern with
//! backticked subjects; the file envelope carries the source path while the message stays greppable.

mod codes;

pub use codes::TastyDiagnosticCode;
pub use diagnostics::{Diagnostic, DiagnosticError};

use shared::parse::NestingRefusal;

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

/// A file the nesting gate refused before Oxc saw it: the file contributes no declarations, and the parse-failure
/// code locates the line where nesting crossed the limit.
pub(crate) fn nesting_refused(
    file_id: &str,
    refusal: NestingRefusal,
) -> Result<Diagnostic, DiagnosticError> {
    Ok(Diagnostic::warning(
        TastyDiagnosticCode::ParseError.as_str(),
        refusal.message(),
    )?
    .with_location(file_id, Some(refusal.line), None))
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

/// Path-shaped module request that names no file: its names stay external, siblings keep resolving.
pub(crate) fn unresolved_import(
    file_id: &str,
    specifier: &str,
) -> Result<Diagnostic, DiagnosticError> {
    Diagnostic::warning(
        TastyDiagnosticCode::UnresolvedImport.as_str(),
        format!(
            "unresolved import `{specifier}` in `{file_id}`: no file matches it, so the names it provides stay unresolved"
        ),
    )?
    .with_location(file_id, None, None)
    .with_help(vec![format!(
        "create the file for `{specifier}` or correct the specifier in `{file_id}`"
    )])
}

/// `declare module '<module>' { … }` in `file_id` augments a path-shaped module: tasty does not merge
/// the augmenting declarations into it, so the augmentation is named instead of dropped.
pub(crate) fn unsupported_augmentation(
    file_id: &str,
    module: &str,
) -> Result<Diagnostic, DiagnosticError> {
    Diagnostic::warning(
        TastyDiagnosticCode::UnsupportedAugmentation.as_str(),
        format!(
            "module augmentation of `{module}` in `{file_id}` is not merged; its declarations are not added to `{module}`"
        ),
    )?
    .with_location(file_id, None, None)
    .with_help(vec![format!(
        "declare the members in `{module}` itself instead of augmenting it"
    )])
}

/// Module-level statement tasty does not model: `construct` names it, and the statement is skipped.
pub(crate) fn unsupported_syntax(
    file_id: &str,
    construct: &str,
) -> Result<Diagnostic, DiagnosticError> {
    Diagnostic::warning(
        TastyDiagnosticCode::UnsupportedSyntax.as_str(),
        format!(
            "unsupported syntax `{construct}` in `{file_id}`: tasty does not model this statement and skips it"
        ),
    )?
    .with_location(file_id, None, None)
    .with_help(vec![format!(
        "re-declare what `{construct}` provides as named exports of `{file_id}`"
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

        let unresolved = unresolved_import("src/root.ts", "./missing").unwrap();
        assert_eq!(unresolved.code.as_str(), "TST-W-UNRESOLVED-IMPORT");
        assert_eq!(unresolved.severity, Severity::Warning);
        assert_eq!(unresolved.file.as_deref(), Some("src/root.ts"));
        assert!(unresolved.message.contains("`./missing`"));

        let augmentation = unsupported_augmentation("src/augment.ts", "./base").unwrap();
        assert_eq!(augmentation.code.as_str(), "TST-W-UNSUPPORTED-AUGMENTATION");
        assert_eq!(augmentation.severity, Severity::Warning);
        assert_eq!(augmentation.file.as_deref(), Some("src/augment.ts"));
        assert!(augmentation.message.contains("`./base`"));

        let syntax = unsupported_syntax("src/globals.ts", "declare global").unwrap();
        assert_eq!(syntax.code.as_str(), "TST-W-UNSUPPORTED-SYNTAX");
        assert_eq!(syntax.severity, Severity::Warning);
        assert!(syntax.message.contains("`declare global`"));
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
            (
                unresolved_import("src/root.ts", "./missing").unwrap(),
                "{\"severity\":\"warning\",\"code\":\"TST-W-UNRESOLVED-IMPORT\",\
                 \"message\":\"unresolved import `./missing` in `src/root.ts`: no file matches it, so the names it provides stay unresolved\",\
                 \"file\":\"src/root.ts\",\
                 \"help\":[\"create the file for `./missing` or correct the specifier in `src/root.ts`\"]}",
            ),
            (
                unsupported_augmentation("src/augment.ts", "./base").unwrap(),
                "{\"severity\":\"warning\",\"code\":\"TST-W-UNSUPPORTED-AUGMENTATION\",\
                 \"message\":\"module augmentation of `./base` in `src/augment.ts` is not merged; its declarations are not added to `./base`\",\
                 \"file\":\"src/augment.ts\",\
                 \"help\":[\"declare the members in `./base` itself instead of augmenting it\"]}",
            ),
            (
                unsupported_syntax("src/globals.ts", "declare global").unwrap(),
                "{\"severity\":\"warning\",\"code\":\"TST-W-UNSUPPORTED-SYNTAX\",\
                 \"message\":\"unsupported syntax `declare global` in `src/globals.ts`: tasty does not model this statement and skips it\",\
                 \"file\":\"src/globals.ts\",\
                 \"help\":[\"re-declare what `declare global` provides as named exports of `src/globals.ts`\"]}",
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

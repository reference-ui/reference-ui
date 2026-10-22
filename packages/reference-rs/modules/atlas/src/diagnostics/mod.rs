//! Atlas diagnostics: the module's typed failure vocabulary rooted in the shared template.
//! Producers mint `ATL-W-*` / `ATL-E-*` codes from [`codes::AtlasDiagnosticCode`] and emit the
//! template [`Diagnostic`] values every consumer already parses, so atlas failures filter, group,
//! and document by code instead of string matching. Messages follow the subject-first pattern with
//! backticked subjects; the file envelope carries the component source while the message stays greppable.

mod codes;

pub use codes::AtlasDiagnosticCode;
pub use diagnostics::{Diagnostic, DiagnosticError};

/// Atlas diagnostics are template diagnostics: severity plus validated code plus message.
/// No sibling shape — the submodule owns the vocabulary, the template owns the representation.
pub type AtlasDiagnostic = Diagnostic;

/// Named props type resolves nowhere: a partial component is kept with empty props.
pub(crate) fn unresolved_props_type(
    source: &str,
    component: &str,
    type_name: &str,
) -> Result<Diagnostic, DiagnosticError> {
    Diagnostic::warning(
        AtlasDiagnosticCode::UnresolvedPropsType.as_str(),
        format!(
            "Component `{component}` references props type `{type_name}` which Atlas could not resolve."
        ),
    )?
    .with_location(source, None, None)
    .with_help(vec![format!(
        "import `{type_name}` for `{component}` or define it in scope"
    )])
}

/// Inline props object annotation: Atlas indexes named types only, so the component is omitted.
pub(crate) fn unsupported_props_annotation(
    source: &str,
    component: &str,
) -> Result<Diagnostic, DiagnosticError> {
    Diagnostic::warning(
        AtlasDiagnosticCode::UnsupportedPropsAnnotation.as_str(),
        format!(
            "Component `{component}` uses an inline props type annotation that Atlas does not index."
        ),
    )?
    .with_location(source, None, None)
    .with_help(vec![format!(
        "name the props type of `{component}` instead of inlining the object"
    )])
}

/// Included package resolves nowhere: the package is skipped with its siblings kept.
pub(crate) fn unresolved_include_package(package: &str) -> Result<Diagnostic, DiagnosticError> {
    Diagnostic::warning(
        AtlasDiagnosticCode::UnresolvedIncludePackage.as_str(),
        format!("Include package `{package}` could not be resolved; skipping."),
    )?
    .with_help(vec![format!(
        "check the name of `{package}` or install it alongside the app"
    )])
}

/// Scan refusal: discovery or read failed, so the analysis is refused with empty components.
pub(crate) fn scan_failed(reason: impl Into<String>) -> Result<Diagnostic, DiagnosticError> {
    Diagnostic::error(
        AtlasDiagnosticCode::ScanFailed.as_str(),
        reason.into(),
    )
}

/// Package scan failure: the package's discovery or read failed, so the package
/// is skipped while its siblings still index.
pub(crate) fn package_scan_failed(
    package: &str,
    reason: impl Into<String>,
) -> Result<Diagnostic, DiagnosticError> {
    Diagnostic::warning(
        AtlasDiagnosticCode::PackageScanFailed.as_str(),
        format!(
            "Package `{package}` could not be scanned; skipping it: {}.",
            reason.into()
        ),
    )?
    .with_help(vec![format!(
        "fix `{package}` so it scans or drop it from include"
    )])
}

/// A source file nested past the nesting gate: it is refused before Oxc parses it and left out of the module map, so
/// its siblings still analyze. The file locates the warning, and the line is where the nesting crossed the limit.
pub(crate) fn skipped_file(
    file: &str,
    refusal: shared::parse::NestingRefusal,
) -> Result<Diagnostic, DiagnosticError> {
    let warning = Diagnostic::warning(AtlasDiagnosticCode::SkippedFile.as_str(), refusal.message())?;
    Ok(warning.with_location(file, Some(refusal.line), None))
}

#[cfg(test)]
mod tests {
    use super::*;
    use diagnostics::Severity;

    #[test]
    fn skipped_file_locates_the_refused_file_at_its_line() {
        let refusal = shared::parse::NestingRefusal {
            depth: 1025,
            line: 3,
        };
        let skipped = skipped_file("src/Deep.tsx", refusal).unwrap();
        assert_eq!(skipped.code.as_str(), "ATL-W-SKIPPED-FILE");
        assert_eq!(skipped.severity, Severity::Warning);
        assert_eq!(skipped.file.as_deref(), Some("src/Deep.tsx"));
        assert_eq!(skipped.line, Some(3));
        assert_eq!(
            skipped.message,
            "nesting deeper than 1024 levels at line 3; split or flatten the deeply nested expression"
        );
    }

    #[test]
    fn constructors_emit_located_warnings_with_stable_codes() {
        let unresolved =
            unresolved_props_type("./components/BrokenCard.tsx", "BrokenCard", "MissingProps")
                .unwrap();
        assert_eq!(unresolved.code.as_str(), "ATL-W-UNRESOLVED-PROPS-TYPE");
        assert_eq!(unresolved.severity, Severity::Warning);
        assert_eq!(unresolved.file.as_deref(), Some("./components/BrokenCard.tsx"));
        assert!(unresolved.message.contains("`BrokenCard`"));
        assert!(unresolved.message.contains("`MissingProps`"));
        assert_eq!(
            unresolved.help,
            Some(vec![
                "import `MissingProps` for `BrokenCard` or define it in scope".to_string()
            ])
        );

        let unsupported =
            unsupported_props_annotation("./components/InlineBadge.tsx", "InlineBadge").unwrap();
        assert_eq!(
            unsupported.code.as_str(),
            "ATL-W-UNSUPPORTED-PROPS-ANNOTATION"
        );
        assert_eq!(unsupported.severity, Severity::Warning);
        assert!(unsupported.message.contains("`InlineBadge`"));
        assert_eq!(
            unsupported.help,
            Some(vec![
                "name the props type of `InlineBadge` instead of inlining the object".to_string()
            ])
        );

        let package = unresolved_include_package("@fixtures/missing-ui").unwrap();
        assert_eq!(
            package.code.as_str(),
            "ATL-W-UNRESOLVED-INCLUDE-PACKAGE"
        );
        assert_eq!(package.severity, Severity::Warning);
        assert!(package.message.contains("`@fixtures/missing-ui`"));
        assert!(package.file.is_none());
        assert_eq!(
            package.help,
            Some(vec![
                "check the name of `@fixtures/missing-ui` or install it alongside the app"
                    .to_string()
            ])
        );
    }

    #[test]
    fn scan_failures_carry_the_error_code() {
        let failed = scan_failed("Failed to discover Atlas files: gone").unwrap();
        assert_eq!(failed.code.as_str(), "ATL-E-SCAN-FAILED");
        assert_eq!(failed.severity, Severity::Error);
        assert!(failed.message.contains("Failed to discover"));
    }

    #[test]
    fn package_scan_failures_warn_naming_the_package() {
        let failed = package_scan_failed("@probe/uilib", "Glob walk error: denied").unwrap();
        assert_eq!(failed.code.as_str(), "ATL-W-PACKAGE-SCAN-FAILED");
        assert_eq!(failed.severity, Severity::Warning);
        assert!(failed.message.contains("`@probe/uilib`"));
        assert!(failed.message.contains("Glob walk error: denied"));
        assert!(failed.file.is_none());
        assert_eq!(
            failed.help,
            Some(vec![
                "fix `@probe/uilib` so it scans or drop it from include".to_string()
            ])
        );
    }

    #[test]
    fn every_warning_pins_its_exact_wire_bytes() {
        let cases = [
            (
                unresolved_props_type("./components/BrokenCard.tsx", "BrokenCard", "MissingProps")
                    .unwrap(),
                "{\"severity\":\"warning\",\"code\":\"ATL-W-UNRESOLVED-PROPS-TYPE\",\
                 \"message\":\"Component `BrokenCard` references props type `MissingProps` which Atlas could not resolve.\",\
                 \"file\":\"./components/BrokenCard.tsx\",\
                 \"help\":[\"import `MissingProps` for `BrokenCard` or define it in scope\"]}",
            ),
            (
                unsupported_props_annotation("./components/InlineBadge.tsx", "InlineBadge").unwrap(),
                "{\"severity\":\"warning\",\"code\":\"ATL-W-UNSUPPORTED-PROPS-ANNOTATION\",\
                 \"message\":\"Component `InlineBadge` uses an inline props type annotation that Atlas does not index.\",\
                 \"file\":\"./components/InlineBadge.tsx\",\
                 \"help\":[\"name the props type of `InlineBadge` instead of inlining the object\"]}",
            ),
            (
                unresolved_include_package("@fixtures/missing-ui").unwrap(),
                "{\"severity\":\"warning\",\"code\":\"ATL-W-UNRESOLVED-INCLUDE-PACKAGE\",\
                 \"message\":\"Include package `@fixtures/missing-ui` could not be resolved; skipping.\",\
                 \"help\":[\"check the name of `@fixtures/missing-ui` or install it alongside the app\"]}",
            ),
            (
                package_scan_failed("@probe/uilib", "Glob walk error: denied").unwrap(),
                "{\"severity\":\"warning\",\"code\":\"ATL-W-PACKAGE-SCAN-FAILED\",\
                 \"message\":\"Package `@probe/uilib` could not be scanned; skipping it: Glob walk error: denied.\",\
                 \"help\":[\"fix `@probe/uilib` so it scans or drop it from include\"]}",
            ),
        ];
        for (diagnostic, wire) in cases {
            assert_eq!(serde_json::to_string(&diagnostic).unwrap(), wire);
        }
    }
}

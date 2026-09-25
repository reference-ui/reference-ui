//! Typegen diagnostics: the module's typed failure vocabulary rooted in the shared template.
//! Producers mint `TGN-W-*` / `TGN-E-*` codes from [`codes::TypegenDiagnosticCode`] and emit the
//! template [`Diagnostic`] values every consumer already parses, so typegen skips filter, group,
//! and document by code instead of vanishing silently. Every printer skip the author can trigger
//! owns one warning; the spec refusal owns the one error. Messages follow the subject-first pattern
//! with backticked subjects; all rows are request-level and carry no file envelope.

mod codes;
mod collect;

pub use codes::TypegenDiagnosticCode;
pub(crate) use collect::collect_diagnostics;
pub use diagnostics::{Diagnostic, DiagnosticError};

/// Typegen diagnostics are template diagnostics: severity plus validated code plus message.
/// No sibling shape — the submodule owns the vocabulary, the template owns the representation.
pub type TypegenDiagnostic = Diagnostic;

/// A dump token category with no printed union; its tokens are omitted from the `.d.ts`.
/// Near-misses against the printer's known categories carry a did-you-mean nudge.
pub(crate) fn unknown_token_category(
    category: &str,
    token_count: usize,
) -> Result<Diagnostic, DiagnosticError> {
    let subject = format!(
        "token category `{category}` has no printed union; omitting {token_count} token(s)"
    );
    let known_categories = crate::emit::tokens::known_token_categories();
    let message = match diagnostics::message::suggest_for_code(
        TypegenDiagnosticCode::UnknownTokenCategory.as_str(),
        category,
        &known_categories,
    ) {
        Some(known) => diagnostics::message::join_lines(&[
            &subject,
            &diagnostics::message::did_you_mean(known),
        ]),
        None => subject,
    };
    Diagnostic::warning(
        TypegenDiagnosticCode::UnknownTokenCategory.as_str(),
        message,
    )
}

/// A recipe name that cannot PascalCase to a TypeScript identifier; the recipe is omitted.
pub(crate) fn invalid_recipe_name(name: &str) -> Result<Diagnostic, DiagnosticError> {
    Diagnostic::warning(
        TypegenDiagnosticCode::InvalidRecipeName.as_str(),
        format!("recipe `{name}` cannot form a TypeScript type name; omitting the recipe"),
    )
}

/// A recipe with no printable variant axes; the whole recipe is omitted.
pub(crate) fn empty_recipe(name: &str) -> Result<Diagnostic, DiagnosticError> {
    Diagnostic::warning(
        TypegenDiagnosticCode::EmptyRecipe.as_str(),
        format!("recipe `{name}` declares no variant values; omitting the recipe"),
    )
}

/// One variant axis with no values while sibling axes still print; the axis is skipped.
pub(crate) fn empty_recipe_axis(name: &str, axis: &str) -> Result<Diagnostic, DiagnosticError> {
    Diagnostic::warning(
        TypegenDiagnosticCode::EmptyRecipe.as_str(),
        format!("recipe `{name}` axis `{axis}` declares no values; skipping the axis"),
    )
}

/// A compound row naming an unknown axis or value; the row is skipped, siblings kept.
/// `row` is one-based for authors; `axis` and `value` name the first offending pair.
pub(crate) fn invalid_compound_variant(
    name: &str,
    row: usize,
    axis: &str,
    value: &str,
) -> Result<Diagnostic, DiagnosticError> {
    Diagnostic::warning(
        TypegenDiagnosticCode::InvalidCompoundVariant.as_str(),
        format!("recipe `{name}` compound row {row} names unknown `{axis}={value}`; skipping the row"),
    )
}

/// A strict name outside `colors` / `radii` / `spacing`; skipped with a near-match nudge.
pub(crate) fn unknown_strict_category(name: &str) -> Result<Diagnostic, DiagnosticError> {
    let subject = format!("strict category `{name}` is unknown; skipping it");
    let message = match diagnostics::message::suggest_for_code(
        TypegenDiagnosticCode::UnknownStrictCategory.as_str(),
        name,
        crate::emit::strict::KNOWN_STRICT_CATEGORIES,
    ) {
        Some(known) => diagnostics::message::join_lines(&[
            &subject,
            &diagnostics::message::did_you_mean(known),
        ]),
        None => subject,
    };
    Diagnostic::warning(
        TypegenDiagnosticCode::UnknownStrictCategory.as_str(),
        message,
    )
}

/// A known strict category with no tokens in this system; no wrapper is printed.
pub(crate) fn absent_strict_category(name: &str) -> Result<Diagnostic, DiagnosticError> {
    Diagnostic::warning(
        TypegenDiagnosticCode::AbsentStrictCategory.as_str(),
        format!("strict category `{name}` has no tokens in this system; skipping the wrapper"),
    )
}

/// A font family declaring no weights; omitted from the registry.
pub(crate) fn empty_font_family(name: &str) -> Result<Diagnostic, DiagnosticError> {
    Diagnostic::warning(
        TypegenDiagnosticCode::EmptyFontFamily.as_str(),
        format!("font family `{name}` declares no weights; omitting the family"),
    )
}

/// A recipe whose PascalCase stem collides with an earlier recipe in list order;
/// the first wins and this recipe is omitted, both aliases.
pub(crate) fn duplicate_recipe_stem(name: &str, stem: &str) -> Result<Diagnostic, DiagnosticError> {
    Diagnostic::warning(
        TypegenDiagnosticCode::DuplicateRecipeStem.as_str(),
        format!(
            "recipe `{name}` collides with an earlier recipe on type stem `{stem}`; omitting the recipe"
        ),
    )
}

/// Spec refusal prefix: the baseSystem value failed contract validation, so the
/// request is refused wholesale as a coded throw carrying `TGN-E-INVALID-BASE-SYSTEM`.
/// Public because the napi boundary (compiled in the host crate) formats the throw.
pub fn invalid_base_system(reason: impl Into<String>) -> String {
    format!(
        "{}: invalid baseSystem spec: {}",
        TypegenDiagnosticCode::InvalidBaseSystem.as_str(),
        reason.into()
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use diagnostics::Severity;

    #[test]
    fn constructors_emit_warnings_with_stable_codes() {
        let rows = [
            unknown_token_category("animations", 3).unwrap(),
            invalid_recipe_name("123").unwrap(),
            empty_recipe("card").unwrap(),
            empty_recipe_axis("button", "size").unwrap(),
            invalid_compound_variant("button", 2, "tone", "nope").unwrap(),
            unknown_strict_category("fonts").unwrap(),
            absent_strict_category("spacing").unwrap(),
            empty_font_family("display").unwrap(),
            duplicate_recipe_stem("Button", "Button").unwrap(),
        ];
        let codes = [
            "TGN-W-UNKNOWN-TOKEN-CATEGORY",
            "TGN-W-INVALID-RECIPE-NAME",
            "TGN-W-EMPTY-RECIPE",
            "TGN-W-EMPTY-RECIPE",
            "TGN-W-INVALID-COMPOUND-VARIANT",
            "TGN-W-UNKNOWN-STRICT-CATEGORY",
            "TGN-W-ABSENT-STRICT-CATEGORY",
            "TGN-W-EMPTY-FONT-FAMILY",
            "TGN-W-DUPLICATE-RECIPE-STEM",
        ];
        for (diagnostic, code) in rows.iter().zip(codes) {
            assert_eq!(diagnostic.code.as_str(), code);
            assert_eq!(diagnostic.severity, Severity::Warning);
            assert!(diagnostic.file.is_none());
            assert!(!diagnostic.message.trim().is_empty());
        }
        assert!(rows[0].message.contains("`animations`"));
        assert!(rows[4].message.contains("`tone=nope`"));
    }

    #[test]
    fn unknown_strict_suggests_near_names_and_stays_quiet_when_far() {
        let near = unknown_strict_category("colour").unwrap();
        assert!(near.message.contains("did you mean `colors`?"), "{near:?}");
        let far = unknown_strict_category("zzz").unwrap();
        assert!(!far.message.contains("did you mean"), "{far:?}");
    }

    #[test]
    fn unknown_token_category_suggests_near_names_and_stays_quiet_when_far() {
        let near = unknown_token_category("colour", 2).unwrap();
        assert!(near.message.contains("did you mean `colors`?"), "{near:?}");
        let far = unknown_token_category("animations", 3).unwrap();
        assert!(!far.message.contains("did you mean"), "{far:?}");
    }

    #[test]
    fn every_warning_pins_its_exact_wire_bytes() {
        let cases = [
            (
                unknown_token_category("animations", 3).unwrap(),
                "{\"severity\":\"warning\",\"code\":\"TGN-W-UNKNOWN-TOKEN-CATEGORY\",\
                 \"message\":\"token category `animations` has no printed union; omitting 3 token(s)\"}",
            ),
            (
                invalid_recipe_name("123").unwrap(),
                "{\"severity\":\"warning\",\"code\":\"TGN-W-INVALID-RECIPE-NAME\",\
                 \"message\":\"recipe `123` cannot form a TypeScript type name; omitting the recipe\"}",
            ),
            (
                empty_recipe("card").unwrap(),
                "{\"severity\":\"warning\",\"code\":\"TGN-W-EMPTY-RECIPE\",\
                 \"message\":\"recipe `card` declares no variant values; omitting the recipe\"}",
            ),
            (
                empty_recipe_axis("button", "size").unwrap(),
                "{\"severity\":\"warning\",\"code\":\"TGN-W-EMPTY-RECIPE\",\
                 \"message\":\"recipe `button` axis `size` declares no values; skipping the axis\"}",
            ),
            (
                invalid_compound_variant("button", 2, "tone", "nope").unwrap(),
                "{\"severity\":\"warning\",\"code\":\"TGN-W-INVALID-COMPOUND-VARIANT\",\
                 \"message\":\"recipe `button` compound row 2 names unknown `tone=nope`; skipping the row\"}",
            ),
            (
                unknown_strict_category("fonts").unwrap(),
                "{\"severity\":\"warning\",\"code\":\"TGN-W-UNKNOWN-STRICT-CATEGORY\",\
                 \"message\":\"strict category `fonts` is unknown; skipping it\"}",
            ),
            (
                absent_strict_category("spacing").unwrap(),
                "{\"severity\":\"warning\",\"code\":\"TGN-W-ABSENT-STRICT-CATEGORY\",\
                 \"message\":\"strict category `spacing` has no tokens in this system; skipping the wrapper\"}",
            ),
            (
                empty_font_family("display").unwrap(),
                "{\"severity\":\"warning\",\"code\":\"TGN-W-EMPTY-FONT-FAMILY\",\
                 \"message\":\"font family `display` declares no weights; omitting the family\"}",
            ),
            (
                duplicate_recipe_stem("myButton", "MyButton").unwrap(),
                "{\"severity\":\"warning\",\"code\":\"TGN-W-DUPLICATE-RECIPE-STEM\",\
                 \"message\":\"recipe `myButton` collides with an earlier recipe on type stem `MyButton`; omitting the recipe\"}",
            ),
        ];
        for (diagnostic, wire) in cases {
            assert_eq!(serde_json::to_string(&diagnostic).unwrap(), wire);
        }
    }

    #[test]
    fn spec_refusals_carry_the_error_code_prefix() {
        let message = invalid_base_system("unsupported schema version 999: expected 1");
        assert_eq!(
            message,
            "TGN-E-INVALID-BASE-SYSTEM: invalid baseSystem spec: \
             unsupported schema version 999: expected 1"
        );
        let code: TypegenDiagnosticCode = "TGN-E-INVALID-BASE-SYSTEM".parse().unwrap();
        assert_eq!(code, TypegenDiagnosticCode::InvalidBaseSystem);
        let parsed = diagnostics::DiagnosticCode::parse("TGN-E-INVALID-BASE-SYSTEM").unwrap();
        assert!(parsed.is_error_code());
    }
}

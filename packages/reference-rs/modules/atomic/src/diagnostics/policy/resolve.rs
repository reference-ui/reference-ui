//! Resolve outcome wording: one sentence template per refusal shape.
//!
//! Templates are byte-identical to the legacy resolve call-site strings
//! they replace. The `InvalidCssValue` arm matches on (code, value) by
//! construction: Bool `true` drops are userspace-provable, Bool `false`
//! drops can never be userspace (ledger E9) — Slice 4 hangs the audience
//! split on this same match. Disposition (rejected vs passthrough) never
//! changes a sentence; it travels in the fact for proof.

use super::super::adapters::resolve::ResolveReport;
use super::super::{
    DeclarationDetail, Diagnostic, NameDetail, ResolveDetail, ResolveOutcome, TokenDetail,
    ValueDetail,
};

/// Render one resolve outcome report to its final warning line.
pub fn render(report: &ResolveReport) -> Diagnostic {
    let (code, detail) = match &report.outcome {
        ResolveOutcome::Rejected { code, detail }
        | ResolveOutcome::Passthrough { code, detail }
        | ResolveOutcome::Advisory { code, detail } => (code, detail),
    };
    let message = match detail {
        ResolveDetail::Declaration(declaration) => declaration_sentence(declaration),
        ResolveDetail::Token(token) => token_sentence(token),
    };
    let line = report.location.warning(*code, message);
    let help = help_lines(report.suggestion.as_deref(), detail);
    super::Policy::attach_help(line, help)
}

/// The instance help for one refusal: unknown names head their fix line
/// with the precomputed did-you-mean, every other shape echoes its parts.
/// The container-root advisory stays silent — static wins with no parts.
fn help_lines(suggestion: Option<&str>, detail: &ResolveDetail) -> Vec<String> {
    match detail {
        ResolveDetail::Declaration(declaration) => declaration_help(suggestion, declaration),
        ResolveDetail::Token(token) => token_help(suggestion, token),
    }
}

/// The help for one declaration-shape refusal.
fn declaration_help(suggestion: Option<&str>, detail: &DeclarationDetail) -> Vec<String> {
    match detail {
        DeclarationDetail::Name(name) => name_help(suggestion, name),
        DeclarationDetail::Value(value) => value_help(value),
        DeclarationDetail::ContainerRoot => Vec::new(),
    }
}

/// The help for one unknown-name refusal: the fix headed by did-you-mean.
fn name_help(suggestion: Option<&str>, name: &NameDetail) -> Vec<String> {
    match name {
        NameDetail::Property { prop } => crate::resolve::suggest::suggestion_lines(
            suggestion,
            format!("remove '{prop}' or check its spelling"),
        ),
        NameDetail::Condition { .. } => crate::resolve::suggest::suggestion_lines(
            suggestion,
            "use a condition from the theme".to_string(),
        ),
        NameDetail::UnrealizableExtension { prop } => {
            vec![format!(
                "drop '{prop}'; the dialect has no served css form"
            )]
        }
    }
}

/// The help for one value-shape refusal: the spelling echoed with its fix.
fn value_help(value: &ValueDetail) -> Vec<String> {
    match value {
        ValueDetail::NonCanonicalNumber { prop, spelling } => {
            vec![format!(
                "write '{spelling}' as a plain decimal on '{prop}'"
            )]
        }
        ValueDetail::EmptyString { prop } => {
            vec![format!("remove the empty value on '{prop}'")]
        }
        ValueDetail::InvalidValue { prop, value } => {
            vec![format!(
                "'{prop}' rejects '{value}'; use a CSS keyword, token, or accepted value"
            )]
        }
    }
}

/// The help for one token-shape refusal: the spelling echoed with its fix.
fn token_help(suggestion: Option<&str>, detail: &TokenDetail) -> Vec<String> {
    match detail {
        TokenDetail::MalformedOpacity { text } => {
            vec![format!(
                "write the opacity modifier as /<0-100> (got '{text}')"
            )]
        }
        TokenDetail::UnknownTokenPath { .. } => crate::resolve::suggest::suggestion_lines(
            suggestion,
            "point the path at an existing token".to_string(),
        ),
        TokenDetail::UnknownColor { .. } => crate::resolve::suggest::suggestion_lines(
            suggestion,
            "use a color token or CSS color".to_string(),
        ),
        TokenDetail::UnterminatedBrace { value } => {
            vec![format!("close the '{{' in '{value}'")]
        }
    }
}

/// The sentence for one declaration-shape refusal.
fn declaration_sentence(detail: &DeclarationDetail) -> String {
    match detail {
        DeclarationDetail::Name(name) => name_sentence(name),
        DeclarationDetail::Value(value) => value_sentence(value),
        DeclarationDetail::ContainerRoot => "@container condition emitted but no container root \
         (container-type) is defined in globalCss"
            .to_string(),
    }
}

/// The sentence for one unknown-name refusal.
fn name_sentence(name: &NameDetail) -> String {
    match name {
        NameDetail::Property { prop } => {
            format!("Unknown style property \"{prop}\"")
        }
        NameDetail::Condition { name } => {
            format!("Unknown condition \"{name}\"")
        }
        NameDetail::UnrealizableExtension { prop } => {
            format!("`{prop}` has no CSS lowering; the declaration was dropped")
        }
    }
}

/// The sentence for one value-shape refusal.
fn value_sentence(value: &ValueDetail) -> String {
    match value {
        ValueDetail::NonCanonicalNumber { prop, spelling } => {
            format!("Non-canonical numeric value \"{spelling}\" on `{prop}`")
        }
        ValueDetail::EmptyString { prop } => {
            format!("Empty string value on `{prop}`")
        }
        // F6: the (code, value) split hangs here in Slice 4 — `true` is
        // userspace-provable (runtime queries it, resolve drops it), `false`
        // never userspace (runtime skips holes without querying).
        ValueDetail::InvalidValue { prop, value } => {
            format!("`{prop}` value `{value}` is not valid CSS")
        }
    }
}

/// The sentence for one token-shape refusal.
fn token_sentence(detail: &TokenDetail) -> String {
    match detail {
        TokenDetail::MalformedOpacity { text } => {
            format!("malformed opacity modifier `{text}`")
        }
        TokenDetail::UnknownTokenPath { path } => {
            format!("unknown token path `{path}`")
        }
        TokenDetail::UnknownColor { text } => {
            format!("`{text}` is neither a color token nor a CSS color")
        }
        TokenDetail::UnterminatedBrace { value } => {
            format!("unterminated `{{` in value `{value}`")
        }
    }
}

#[cfg(test)]
mod tests {
    use super::super::Policy;
    use super::*;
    use crate::diagnostics::{DiagnosticCode, DiagnosticLocation};

    fn report(outcome: ResolveOutcome) -> ResolveReport {
        report_with_suggestion(outcome, None)
    }

    fn report_with_suggestion(
        outcome: ResolveOutcome,
        suggestion: Option<Box<str>>,
    ) -> ResolveReport {
        ResolveReport {
            location: DiagnosticLocation {
                file: Some("located.ts".to_string()),
                line: Some(5),
                column: Some(15),
                span: None,
            },
            key: None,
            outcome,
            suggestion,
        }
    }

    fn rejected(detail: ResolveDetail) -> ResolveOutcome {
        ResolveOutcome::Rejected {
            code: DiagnosticCode::UnknownProperty,
            detail,
        }
    }

    #[test]
    fn declaration_sentences_pin_legacy_strings() {
        let declaration =
            DeclarationDetail::Name(NameDetail::Property { prop: "colr".into() });
        let rendered = Policy::render_resolve(&report(rejected(
            ResolveDetail::Declaration(declaration),
        )));
        assert_eq!(rendered.message, "Unknown style property \"colr\"");
        assert_eq!(rendered.file.as_deref(), Some("located.ts"));
        assert_eq!(rendered.line, Some(5));

        let declaration = DeclarationDetail::Name(NameDetail::Condition {
            name: "_nope".into(),
        });
        let rendered = Policy::render_resolve(&report(rejected(
            ResolveDetail::Declaration(declaration),
        )));
        assert_eq!(rendered.message, "Unknown condition \"_nope\"");

        let declaration = DeclarationDetail::Name(NameDetail::UnrealizableExtension {
            prop: "translateX".into(),
        });
        let rendered = Policy::render_resolve(&report(rejected(
            ResolveDetail::Declaration(declaration),
        )));
        assert_eq!(
            rendered.message,
            "`translateX` has no CSS lowering; the declaration was dropped"
        );

        let declaration = DeclarationDetail::Value(ValueDetail::NonCanonicalNumber {
            prop: "width".into(),
            spelling: "0x10".into(),
        });
        let rendered = Policy::render_resolve(&report(rejected(
            ResolveDetail::Declaration(declaration),
        )));
        assert_eq!(
            rendered.message,
            "Non-canonical numeric value \"0x10\" on `width`"
        );

        let declaration =
            DeclarationDetail::Value(ValueDetail::EmptyString { prop: "mt".into() });
        let rendered = Policy::render_resolve(&report(rejected(
            ResolveDetail::Declaration(declaration),
        )));
        assert_eq!(rendered.message, "Empty string value on `mt`");

        let declaration = DeclarationDetail::ContainerRoot;
        let rendered = Policy::render_resolve(&report(rejected(
            ResolveDetail::Declaration(declaration),
        )));
        assert_eq!(
            rendered.message,
            "@container condition emitted but no container root (container-type) \
             is defined in globalCss"
        );
    }

    #[test]
    fn invalid_value_carries_the_spelling_for_the_f6_split() {
        let truthy = DeclarationDetail::Value(ValueDetail::InvalidValue {
            prop: "display".into(),
            value: "true".into(),
        });
        let falsy = DeclarationDetail::Value(ValueDetail::InvalidValue {
            prop: "display".into(),
            value: "false".into(),
        });
        assert_ne!(truthy, falsy);
        let rendered_true = Policy::render_resolve(&report(rejected(
            ResolveDetail::Declaration(truthy),
        )));
        let rendered_false = Policy::render_resolve(&report(rejected(
            ResolveDetail::Declaration(falsy),
        )));
        assert_eq!(
            rendered_true.message,
            "`display` value `true` is not valid CSS"
        );
        assert_eq!(
            rendered_false.message,
            "`display` value `false` is not valid CSS"
        );
    }

    #[test]
    fn token_sentences_pin_legacy_strings() {
        let token = TokenDetail::MalformedOpacity {
            text: "red/".into(),
        };
        let rendered = Policy::render_resolve(&report(rejected(ResolveDetail::Token(token))));
        assert_eq!(rendered.message, "malformed opacity modifier `red/`");

        let token = TokenDetail::UnknownTokenPath {
            path: "ui.missing.path".into(),
        };
        let rendered = Policy::render_resolve(&report(rejected(ResolveDetail::Token(token))));
        assert_eq!(rendered.message, "unknown token path `ui.missing.path`");

        let token = TokenDetail::UnknownColor {
            text: "blurple".into(),
        };
        let rendered = Policy::render_resolve(&report(rejected(ResolveDetail::Token(token))));
        assert_eq!(
            rendered.message,
            "`blurple` is neither a color token nor a CSS color"
        );

        let token = TokenDetail::UnterminatedBrace {
            value: "1px solid {colors.gray.800".into(),
        };
        let rendered = Policy::render_resolve(&report(rejected(ResolveDetail::Token(token))));
        assert_eq!(
            rendered.message,
            "unterminated `{` in value `1px solid {colors.gray.800`"
        );
    }

    #[test]
    fn suggestion_codes_head_the_fix_with_did_you_mean() {
        let property = ResolveDetail::Declaration(DeclarationDetail::Name(NameDetail::Property {
            prop: "colr".into(),
        }));
        let rendered = Policy::render_resolve(&report_with_suggestion(
            rejected(property),
            Some("color".into()),
        ));
        assert_eq!(
            rendered.help,
            Some(vec![
                "did you mean `color`?".to_string(),
                "remove 'colr' or check its spelling".to_string(),
            ])
        );
        let lonely = Policy::render_resolve(&report(rejected(
            ResolveDetail::Declaration(DeclarationDetail::Name(NameDetail::Property {
                prop: "zzz".into(),
            })),
        )));
        assert_eq!(
            lonely.help,
            Some(vec!["remove 'zzz' or check its spelling".to_string()])
        );
        let path = ResolveDetail::Token(TokenDetail::UnknownTokenPath {
            path: "ui.ghost".into(),
        });
        let rendered = Policy::render_resolve(&report_with_suggestion(
            rejected(path),
            Some("ui.ghost-500".into()),
        ));
        assert_eq!(
            rendered.help,
            Some(vec![
                "did you mean `ui.ghost-500`?".to_string(),
                "point the path at an existing token".to_string(),
            ])
        );
    }

    #[test]
    fn value_token_and_extension_shapes_echo_their_parts() {
        let cases = [
            (
                ResolveDetail::Declaration(DeclarationDetail::Value(
                    ValueDetail::NonCanonicalNumber {
                        prop: "width".into(),
                        spelling: "0x10".into(),
                    },
                )),
                "write '0x10' as a plain decimal on 'width'",
            ),
            (
                ResolveDetail::Declaration(DeclarationDetail::Value(ValueDetail::EmptyString {
                    prop: "mt".into(),
                })),
                "remove the empty value on 'mt'",
            ),
            (
                ResolveDetail::Declaration(DeclarationDetail::Value(ValueDetail::InvalidValue {
                    prop: "display".into(),
                    value: "true".into(),
                })),
                "'display' rejects 'true'; use a CSS keyword, token, or accepted value",
            ),
            (
                ResolveDetail::Token(TokenDetail::MalformedOpacity { text: "red/".into() }),
                "write the opacity modifier as /<0-100> (got 'red/')",
            ),
            (
                ResolveDetail::Token(TokenDetail::UnterminatedBrace {
                    value: "1px solid {colors.gray.800".into(),
                }),
                "close the '{' in '1px solid {colors.gray.800'",
            ),
            (
                ResolveDetail::Declaration(DeclarationDetail::Name(
                    NameDetail::UnrealizableExtension { prop: "translateX".into() },
                )),
                "drop 'translateX'; the dialect has no served css form",
            ),
        ];
        for (detail, expected) in cases {
            let rendered = Policy::render_resolve(&report(rejected(detail)));
            assert_eq!(rendered.help, Some(vec![expected.to_string()]));
        }
        let advisory = Policy::render_resolve(&report(ResolveOutcome::Advisory {
            code: DiagnosticCode::MissingContainerRoot,
            detail: ResolveDetail::Declaration(DeclarationDetail::ContainerRoot),
        }));
        assert_eq!(advisory.help, None);
    }

    #[test]
    fn disposition_never_changes_the_sentence() {
        let detail = ResolveDetail::Declaration(DeclarationDetail::Value(ValueDetail::NonCanonicalNumber {
            prop: "width".into(),
            spelling: "0x10".into(),
        }));
        let expected = "Non-canonical numeric value \"0x10\" on `width`";
        for outcome in [
            ResolveOutcome::Rejected {
                code: DiagnosticCode::NonCanonicalNumeric,
                detail: detail.clone(),
            },
            ResolveOutcome::Passthrough {
                code: DiagnosticCode::NonCanonicalNumeric,
                detail: detail.clone(),
            },
        ] {
            let rendered = Policy::render_resolve(&report(outcome));
            assert_eq!(rendered.message, expected);
        }
    }
}

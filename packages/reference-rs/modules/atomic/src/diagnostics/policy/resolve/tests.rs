//! Pins the resolver's legacy sentences and help lines: declaration, name, value, token, and
//! extension shapes keep their exact wording. Fixtures build resolve reports from typed details, so
//! a disposition change must never alter the sentence.

use super::super::Policy;
use super::*;
use crate::diagnostics::{DiagnosticCode, DiagnosticLocation};

fn report(outcome: ResolveOutcome) -> ResolveReport {
    report_with_suggestion(outcome, None)
}

fn report_with_suggestion(outcome: ResolveOutcome, suggestion: Option<Box<str>>) -> ResolveReport {
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
        external: false,
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
    let declaration = DeclarationDetail::Name(NameDetail::Property {
        prop: "colr".into(),
    });
    let rendered =
        Policy::render_resolve(&report(rejected(ResolveDetail::Declaration(declaration))));
    assert_eq!(rendered.message, "Unknown style property \"colr\"");
    assert_eq!(rendered.file.as_deref(), Some("located.ts"));
    assert_eq!(rendered.line, Some(5));

    let declaration = DeclarationDetail::Name(NameDetail::Condition {
        name: "_nope".into(),
    });
    let rendered =
        Policy::render_resolve(&report(rejected(ResolveDetail::Declaration(declaration))));
    assert_eq!(rendered.message, "Unknown condition \"_nope\"");

    let declaration = DeclarationDetail::Name(NameDetail::UnrealizableExtension {
        prop: "translateX".into(),
    });
    let rendered =
        Policy::render_resolve(&report(rejected(ResolveDetail::Declaration(declaration))));
    assert_eq!(
        rendered.message,
        "`translateX` has no CSS lowering; the declaration was dropped"
    );

    let declaration = DeclarationDetail::Value(ValueDetail::NonCanonicalNumber {
        prop: "width".into(),
        spelling: "0x10".into(),
    });
    let rendered =
        Policy::render_resolve(&report(rejected(ResolveDetail::Declaration(declaration))));
    assert_eq!(
        rendered.message,
        "Non-canonical numeric value \"0x10\" on `width`"
    );

    let declaration = DeclarationDetail::Value(ValueDetail::EmptyString { prop: "mt".into() });
    let rendered =
        Policy::render_resolve(&report(rejected(ResolveDetail::Declaration(declaration))));
    assert_eq!(rendered.message, "Empty string value on `mt`");

    let declaration = DeclarationDetail::ContainerRoot;
    let rendered =
        Policy::render_resolve(&report(rejected(ResolveDetail::Declaration(declaration))));
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
    let rendered_true =
        Policy::render_resolve(&report(rejected(ResolveDetail::Declaration(truthy))));
    let rendered_false =
        Policy::render_resolve(&report(rejected(ResolveDetail::Declaration(falsy))));
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

    let token = TokenDetail::UnknownToken {
        text: "upGap".into(),
        category: "spacing".into(),
    };
    let rendered = Policy::render_resolve(&report(rejected(ResolveDetail::Token(token))));
    assert_eq!(rendered.message, "`upGap` is not a spacing token");
    assert!(rendered
        .help
        .as_ref()
        .is_some_and(|lines| lines.iter().any(|line| line.contains("spacing token"))));

    let token = TokenDetail::UnknownToken {
        text: "upRadius".into(),
        category: "radii".into(),
    };
    let rendered = Policy::render_resolve(&report(rejected(ResolveDetail::Token(token))));
    assert_eq!(rendered.message, "`upRadius` is not a radius token");
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
    let lonely = Policy::render_resolve(&report(rejected(ResolveDetail::Declaration(
        DeclarationDetail::Name(NameDetail::Property { prop: "zzz".into() }),
    ))));
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
            ResolveDetail::Declaration(DeclarationDetail::Value(ValueDetail::NonCanonicalNumber {
                prop: "width".into(),
                spelling: "0x10".into(),
            })),
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
            ResolveDetail::Token(TokenDetail::MalformedOpacity {
                text: "red/".into(),
            }),
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
                NameDetail::UnrealizableExtension {
                    prop: "translateX".into(),
                },
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
    let detail =
        ResolveDetail::Declaration(DeclarationDetail::Value(ValueDetail::NonCanonicalNumber {
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

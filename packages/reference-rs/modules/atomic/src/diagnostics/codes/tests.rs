//! Table-level contract for `DiagnosticCode`: every row round-trips through serde and parsing,
//! every variant appears exactly once, and the shared template agrees on each code's namespace and
//! severity tag. Assertions run over `CODE_TABLE` itself, so a new row is covered without a new test.

use super::*;

#[test]
fn table_rows_round_trip_through_serde_and_parse() {
    for (code, text) in CODE_TABLE {
        assert_eq!(code.as_str(), text);
        assert_eq!(text.parse(), Ok(code));
        let json = serde_json::to_string(&code).unwrap();
        assert_eq!(json, format!("\"{text}\""));
        let back: DiagnosticCode = serde_json::from_str(&json).unwrap();
        assert_eq!(back, code);
    }
}

#[test]
fn every_variant_appears_exactly_once() {
    use std::collections::HashSet;
    let variants: HashSet<DiagnosticCode> = CODE_TABLE.iter().map(|(code, _)| *code).collect();
    assert_eq!(variants.len(), CODE_TABLE.len());
    for code in [
        DiagnosticCode::DynamicExpression,
        DiagnosticCode::DynamicMember,
        DiagnosticCode::DynamicIdentifier,
        DiagnosticCode::MutatedBinding,
        DiagnosticCode::DynamicTemplate,
        DiagnosticCode::DynamicUnary,
        DiagnosticCode::UnfoldableKey,
        DiagnosticCode::UnknownProperty,
        DiagnosticCode::UnknownBreakpoint,
        DiagnosticCode::NonObjectCondition,
        DiagnosticCode::UnfoldableSpread,
        DiagnosticCode::UnknownCondition,
        DiagnosticCode::MissingContainerRoot,
        DiagnosticCode::NonCanonicalNumeric,
        DiagnosticCode::InvalidCssValue,
        DiagnosticCode::MalformedOpacity,
        DiagnosticCode::UnknownTokenPath,
        DiagnosticCode::TokenCategoryMismatch,
        DiagnosticCode::UnterminatedBrace,
        DiagnosticCode::StaticWildcard,
        DiagnosticCode::EmptyAtRule,
        DiagnosticCode::UnsupportedGlobalValue,
        DiagnosticCode::TraceSkipped,
        DiagnosticCode::MissingHostGraph,
        DiagnosticCode::RecipeArgShape,
        DiagnosticCode::RecipeSpread,
        DiagnosticCode::RecipeClassName,
        DiagnosticCode::ParseError,
        DiagnosticCode::DuplicateRecipe,
        DiagnosticCode::UnknownTokenReference,
        DiagnosticCode::InvalidBaseSystem,
        DiagnosticCode::NonObjectCssArg,
        DiagnosticCode::NonObjectJsxStyle,
        DiagnosticCode::ResponsiveArraySpread,
        DiagnosticCode::TaggedTemplateSite,
        DiagnosticCode::UnfoldableObjectProp,
        DiagnosticCode::DynamicBinary,
        DiagnosticCode::DeadBranch,
        DiagnosticCode::PartialObjectProp,
        DiagnosticCode::TokenCallRefused,
        DiagnosticCode::UnknownColor,
        DiagnosticCode::HarvestSink,
        DiagnosticCode::MissingStylePlan,
        DiagnosticCode::ExpectedLookup,
        DiagnosticCode::DynamicSlot,
        DiagnosticCode::ResponsiveLeafImportant,
        DiagnosticCode::UnrealizableExtension,
        DiagnosticCode::ConflictingScanInputs,
        DiagnosticCode::UnknownRetentionToken,
        DiagnosticCode::DrainedRetentionToken,
        DiagnosticCode::RhythmRootCycle,
        DiagnosticCode::UnknownTone,
        DiagnosticCode::UnknownToken,
        DiagnosticCode::UnbracedTokenRef,
    ] {
        assert!(variants.contains(&code), "missing table row: {code:?}");
    }
}

#[test]
fn warning_and_error_codes_parse_in_the_shared_template() {
    for (_, text) in CODE_TABLE {
        let parsed = diagnostics::DiagnosticCode::parse(text);
        if text.contains("-I-") {
            assert!(
                parsed.is_err(),
                "info code must stay module-local until the template grows an info level: {text}"
            );
            continue;
        }
        let code = parsed.unwrap();
        assert!(code.is_registered_namespace(), "unregistered: {text}");
        assert_eq!(code.namespace(), "ATM");
    }
}

#[test]
fn template_tags_match_table_severity() {
    for (_, text) in CODE_TABLE {
        if text.contains("-I-") {
            continue;
        }
        let code = diagnostics::DiagnosticCode::parse(text).unwrap();
        if text.contains("-W-") {
            assert!(code.is_warning_code(), "tag drift: {text}");
        } else {
            assert!(code.is_error_code(), "tag drift: {text}");
        }
    }
}

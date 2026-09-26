//! Did-you-mean suggestions for resolve's unknown-name refusals.
//!
//! The emit site owns a live `BaseSystem`, so it precomputes the closest
//! known name once; the suggestion rides the report and the fact so policy
//! renders identical help on the pushed line and the compiler re-render.
//! Properties rank against canon consts (no system needed); conditions,
//! token paths, and colors rank against the theme plus canon vocabularies.
//! The shared suggestion gate decides legitimacy, distance decides nearness.

use base_system::BaseSystem;

use crate::diagnostics::{
    DeclarationDetail, DiagnosticCode, NameDetail, ResolveDetail, ResolveOutcome, TokenDetail,
};

/// One fix line, headed by a did-you-mean line when a suggestion rode along.
pub(crate) fn suggestion_lines(suggestion: Option<&str>, fix: String) -> Vec<String> {
    match suggestion {
        Some(candidate) => vec![diagnostics::message::did_you_mean(candidate), fix],
        None => vec![fix],
    }
}

/// The precomputed suggestion for one resolve outcome: the closest known
/// name when the refusal is an unknown-name code with a near candidate.
pub(crate) fn suggestion_for_outcome(
    outcome: &ResolveOutcome,
    system: &BaseSystem,
) -> Option<Box<str>> {
    let (code, detail) = outcome_parts(outcome);
    if !supports_code(code) {
        return None;
    }
    match detail {
        ResolveDetail::Declaration(declaration) => declaration_suggestion(declaration, system),
        ResolveDetail::Token(token) => token_suggestion(token, system),
    }
}

/// The code and detail behind any resolve disposition.
fn outcome_parts(outcome: &ResolveOutcome) -> (&DiagnosticCode, &ResolveDetail) {
    match outcome {
        ResolveOutcome::Rejected { code, detail }
        | ResolveOutcome::Passthrough { code, detail }
        | ResolveOutcome::Advisory { code, detail } => (code, detail),
    }
}

/// The suggestion for one declaration-shape refusal, if it names a name.
fn declaration_suggestion(
    declaration: &DeclarationDetail,
    system: &BaseSystem,
) -> Option<Box<str>> {
    match declaration {
        DeclarationDetail::Name(NameDetail::Property { prop }) => {
            suggest_property(prop).map(|name| name.into())
        }
        DeclarationDetail::Name(NameDetail::Condition { name }) => suggest_condition(name, system),
        _ => None,
    }
}

/// The suggestion for one token-shape refusal, if it names a name.
fn token_suggestion(token: &TokenDetail, system: &BaseSystem) -> Option<Box<str>> {
    match token {
        TokenDetail::UnknownTokenPath { path } => suggest_token_path(path, system),
        TokenDetail::UnknownColor { text } => suggest_color(text, system),
        _ => None,
    }
}

/// True when the outcome's code may carry a suggestion: the gate reads the
/// actual code, so a detail/code mismatch stays silent instead of guessing.
fn supports_code(code: &DiagnosticCode) -> bool {
    diagnostics::message::supports_suggestions(code.as_str())
}

/// The closest known style prop to a bad name, over canon names, aliases,
/// and reference props. Needs no system: the vocabulary is static.
pub(crate) fn suggest_property(prop: &str) -> Option<&'static str> {
    let mut candidates: Vec<&'static str> = Vec::new();
    candidates.extend(canon::CANONICAL_PROPERTIES.iter().map(|property| property.name));
    candidates.extend(canon::ALIASES.iter().map(|alias| alias.alias));
    candidates.extend(canon::REFERENCE_PROPS.iter().copied());
    diagnostics::message::suggest_for_code(
        DiagnosticCode::UnknownProperty.as_str(),
        prop,
        &candidates,
    )
}

/// The closest known condition to a bad name, over the curated catalog,
/// the theme's condition keys, and the breakpoint scale names.
pub(crate) fn suggest_condition(name: &str, system: &BaseSystem) -> Option<Box<str>> {
    let mut candidates: Vec<&str> = Vec::new();
    candidates.extend(canon::NAMED_CONDITIONS.iter().copied());
    candidates.extend(system.conditions.keys());
    candidates.extend(system.breakpoints().names().iter().map(String::as_str));
    gated(DiagnosticCode::UnknownCondition, name, &candidates)
}

/// The closest declared token key to a bad path, over the theme's keys.
/// A trailing opacity modifier never participates in the ranking.
fn suggest_token_path(path: &str, system: &BaseSystem) -> Option<Box<str>> {
    let candidates: Vec<&str> = system.tokens.iter().map(|(key, _)| key).collect();
    gated(
        DiagnosticCode::UnknownTokenPath,
        strip_opacity(path),
        &candidates,
    )
}

/// The closest color to a bad value, over the theme's colors-category
/// names (full keys and scale-relative rests) plus CSS named colors.
fn suggest_color(text: &str, system: &BaseSystem) -> Option<Box<str>> {
    let mut candidates: Vec<&str> = Vec::new();
    for (key, entry) in system.tokens.iter() {
        if entry.category() == "colors" {
            candidates.push(key);
            if let Some(rest) = key.strip_prefix("colors.") {
                candidates.push(rest);
            }
        }
    }
    candidates.extend(
        canon::css::values::named_colors::NAMED_COLORS
            .iter()
            .copied(),
    );
    gated(
        DiagnosticCode::UnknownColor,
        strip_opacity(text),
        &candidates,
    )
}

/// The closest candidate through the shared suggestion gate, owned for the
/// report. The gate refuses non-suggestion codes before distance runs.
fn gated(code: DiagnosticCode, unknown: &str, candidates: &[&str]) -> Option<Box<str>> {
    diagnostics::message::suggest_for_code(code.as_str(), unknown, candidates)
        .map(|name| name.into())
}

/// The value without a trailing `/opacity` modifier, for ranking only.
fn strip_opacity(text: &str) -> &str {
    match text.rsplit_once('/') {
        Some((base, opacity)) if is_opacity_suffix(opacity) => base,
        _ => text,
    }
}

/// True for an opacity suffix: ASCII digits with an optional `%`.
fn is_opacity_suffix(opacity: &str) -> bool {
    let digits = opacity.strip_suffix('%').unwrap_or(opacity);
    !digits.is_empty() && digits.chars().all(|ch| ch.is_ascii_digit())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::diagnostics::ValueDetail;
    use base_system::TokenLeaf;

    fn token_system() -> BaseSystem {
        let mut system = BaseSystem::default();
        system.tokens.insert_leaf(TokenLeaf {
            category: "colors",
            path: "red.500",
            light: "#ef4444",
            dark: "#ef4444",
        });
        system
    }

    #[test]
    fn property_suggests_near_canon_names_and_stays_silent_when_far() {
        assert_eq!(suggest_property("colr"), Some("color"));
        assert_eq!(suggest_property("zzz-no-such-prop"), None);
    }

    #[test]
    fn suggestion_lines_head_the_fix_with_did_you_mean() {
        assert_eq!(
            suggestion_lines(Some("color"), "remove 'colr' or check its spelling".to_string()),
            vec![
                "did you mean `color`?".to_string(),
                "remove 'colr' or check its spelling".to_string(),
            ]
        );
        assert_eq!(
            suggestion_lines(None, "use a condition from the theme".to_string()),
            vec!["use a condition from the theme".to_string()]
        );
    }

    #[test]
    fn outcome_suggests_per_detail_and_gates_other_codes() {
        let system = token_system();
        let property = ResolveOutcome::Rejected {
            code: DiagnosticCode::UnknownProperty,
            detail: ResolveDetail::Declaration(DeclarationDetail::Name(NameDetail::Property {
                prop: "colr".into(),
            })),
        };
        assert_eq!(
            suggestion_for_outcome(&property, &system).as_deref(),
            Some("color")
        );
        let condition = ResolveOutcome::Rejected {
            code: DiagnosticCode::UnknownCondition,
            detail: ResolveDetail::Declaration(DeclarationDetail::Name(NameDetail::Condition {
                name: "_hovr".into(),
            })),
        };
        assert_eq!(
            suggestion_for_outcome(&condition, &system).as_deref(),
            Some("_hover")
        );
        let path = ResolveOutcome::Passthrough {
            code: DiagnosticCode::UnknownTokenPath,
            detail: ResolveDetail::Token(TokenDetail::UnknownTokenPath {
                path: "colors.red.501".into(),
            }),
        };
        assert_eq!(
            suggestion_for_outcome(&path, &system).as_deref(),
            Some("colors.red.500")
        );
        let color = ResolveOutcome::Passthrough {
            code: DiagnosticCode::UnknownColor,
            detail: ResolveDetail::Token(TokenDetail::UnknownColor {
                text: "bleu".into(),
            }),
        };
        assert_eq!(
            suggestion_for_outcome(&color, &system).as_deref(),
            Some("blue")
        );
        let numeric = ResolveOutcome::Rejected {
            code: DiagnosticCode::NonCanonicalNumeric,
            detail: ResolveDetail::Declaration(DeclarationDetail::Value(
                ValueDetail::NonCanonicalNumber {
                    prop: "width".into(),
                    spelling: "0x10".into(),
                },
            )),
        };
        assert_eq!(suggestion_for_outcome(&numeric, &system), None);
    }

    #[test]
    fn opacity_suffixes_never_participate_in_ranking() {
        let system = token_system();
        assert_eq!(
            suggest_color("red.501/50", &system).as_deref(),
            Some("red.500")
        );
        assert_eq!(strip_opacity("colors.red.500/50"), "colors.red.500");
        assert_eq!(strip_opacity("colors.red.500"), "colors.red.500");
    }
}

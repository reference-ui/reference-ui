//! Unknown bare names on token-backed length props: `p="upGap"` names no spacing token.
//! The raw value would print as invalid CSS, so it warns `ATM-W-UNKNOWN-TOKEN` and passes through,
//! the same shape the colour path uses. Numbers, lengths, functions, CSS keywords the prop accepts,
//! dotted paths and every other category stay silent.

use crate::diagnostics::{DiagnosticCode, ResolveDetail, ResolveOutcome, TokenDetail};
use crate::resolve::{want_key, ResolveSession};

use super::scale::is_length_category;
use super::token_category_for_prop;

/// CSS keywords a spacing, radius, size or font-size prop accepts beyond canon's CSS-wide set
/// (`auto`, `none`, `inherit`, ...). Compared ASCII case-insensitively, like canon's keywords.
const LENGTH_KEYWORDS: &[&str] = &[
    "fill-available",
    "fit-content",
    "intrinsic",
    "large",
    "larger",
    "math",
    "max-content",
    "medium",
    "min-content",
    "min-intrinsic",
    "normal",
    "small",
    "smaller",
    "stretch",
    "x-large",
    "x-small",
    "xx-large",
    "xx-small",
    "xxx-large",
];

/// Warn on a bare identifier that names no token in a length-bearing category and is no CSS value
/// the prop accepts. Only the fallback reaches this, after lookup missed, so a real token never warns.
pub(super) fn warn_unknown_token_name(
    prop: &str,
    unbraced: &str,
    session: &mut ResolveSession<'_, '_>,
) {
    let Some(category) = token_category_for_prop(prop).filter(|c| is_length_category(c)) else {
        return;
    };
    if !is_bare_identifier(unbraced)
        || is_length_keyword(unbraced)
        || canon::classify_css_value(unbraced).is_some()
    {
        return;
    }
    let key = want_key(
        session,
        prop,
        serde_json::Value::String(unbraced.to_string()),
    );
    session.emit(
        key,
        ResolveOutcome::Passthrough {
            code: DiagnosticCode::UnknownToken,
            detail: ResolveDetail::Token(TokenDetail::UnknownToken {
                text: unbraced.into(),
                category: category.into(),
            }),
        },
    );
}

/// True for a bare identifier: an ASCII letter, then ASCII letters, digits, `-` or `_`.
/// Dotted paths, braces, spaces, numbers and units all fall outside it.
fn is_bare_identifier(text: &str) -> bool {
    let mut chars = text.chars();
    chars
        .next()
        .is_some_and(|first| first.is_ascii_alphabetic())
        && chars.all(|ch| ch.is_ascii_alphanumeric() || ch == '-' || ch == '_')
}

fn is_length_keyword(text: &str) -> bool {
    LENGTH_KEYWORDS
        .iter()
        .any(|keyword| text.eq_ignore_ascii_case(keyword))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn bare_identifiers_are_letters_digits_dashes_and_underscores() {
        assert!(is_bare_identifier("upGap"));
        assert!(is_bare_identifier("x-large_2"));
        assert!(!is_bare_identifier("4"));
        assert!(!is_bare_identifier("2px"));
        assert!(!is_bare_identifier("colors.gray.900"));
        assert!(!is_bare_identifier("1px solid"));
        assert!(!is_bare_identifier("-webkit-fill-available"));
        assert!(!is_bare_identifier(""));
    }

    #[test]
    fn length_keywords_match_in_any_ascii_case() {
        assert!(is_length_keyword("fit-content"));
        assert!(is_length_keyword("Larger"));
        assert!(!is_length_keyword("upGap"));
    }
}

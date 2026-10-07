//! Harvest color allowlist: which pool values may mint a color.
//!
//! A Color value mints only when it is `currentColor`/`transparent` or names
//! a real color token in the compiling system (full key or unique trailing
//! path — the same resolution the site path honors). A Keyword mints onto a
//! color position only when it is CSS-wide. Color expressions (`oklch()`,
//! hex, unlicensed named colors) and opaque `var()`/`env()` references are
//! guesses, never information, so they never mint. The token licenses the
//! literal: the minted atom paints the pooled text, exactly as a static
//! site would.

use base_system::BaseSystem;

/// CSS-wide keywords that mint onto color positions, sorted. `auto` and
/// `none` are not CSS-wide and stay on the oracle tables in `validity`;
/// `inherit` rides here. Compared case-insensitively, like canon's table.
const COLOR_KEYWORDS: &[&str] = &["inherit", "initial", "revert", "revert-layer", "unset"];

/// Color words that mint without a token license, sorted. Every binding
/// plausibly takes these; compared case-insensitively, like canon's named
/// colors. `inherit` is Keyword-kind and rides `COLOR_KEYWORDS` instead.
const LICENSED_COLOR_WORDS: &[&str] = &["currentcolor", "transparent"];

/// True when a Color pool value mints: the licensed words plus any word the
/// system declares as a color token. Token matching is case-sensitive and
/// fails closed on ambiguity, like the dictionary.
pub(crate) fn is_allowlisted_color(value: &str, system: &BaseSystem) -> bool {
    LICENSED_COLOR_WORDS
        .iter()
        .any(|word| value.eq_ignore_ascii_case(word))
        || system
            .token_category(value)
            .is_some_and(|category| category == "colors")
}

/// True when a Keyword pool value mints onto a color position: the CSS-wide
/// list, case-insensitively. `auto`/`none` never reach here (the oracle
/// tables in `validity` own them); opaque references fail the list.
pub(crate) fn is_color_keyword(value: &str) -> bool {
    COLOR_KEYWORDS
        .iter()
        .any(|keyword| value.eq_ignore_ascii_case(keyword))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn allowlist_tables_stay_sorted() {
        for table in [COLOR_KEYWORDS, LICENSED_COLOR_WORDS] {
            let mut sorted = table.to_vec();
            sorted.sort_unstable();
            assert_eq!(table, sorted.as_slice());
        }
    }
}

//! `weight` dialect utility: expand a named or scoped weight into `fontWeight`.
//! Scoped keys (`sans.bold`) come from the ingested scale; bare names fall back to CSS keywords (`bold` → `700`).
//! Project-specific numeric weights (393, etc.) live on `font()` fragments, not in this table.

use crate::atom::AtomValue;
use base_system::FontScale;

const CSS_WEIGHT_KEYWORDS: &[(&str, &str)] = &[
    ("thin", "100"),
    ("light", "300"),
    ("normal", "400"),
    ("semibold", "600"),
    ("bold", "700"),
    ("black", "900"),
];

/// Expand `weight="bold"` / `weight="sans.bold"` to `fontWeight`.
pub fn lower_weight(raw: &str, fonts: &FontScale) -> Vec<(Box<str>, AtomValue)> {
    // weight="bold" → 700    weight="sans.bold" → scale    weight="393" → as-is
    let mapped = fonts
        .scoped_weight(raw)
        .or_else(|| css_weight_keyword(raw))
        .unwrap_or(raw);
    vec![("fontWeight".into(), AtomValue::String(mapped.into()))]
}

fn css_weight_keyword(raw: &str) -> Option<&'static str> {
    // bold → 700
    CSS_WEIGHT_KEYWORDS
        .iter()
        .find(|(name, _)| *name == raw)
        .map(|(_, value)| *value)
}

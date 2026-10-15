//! `weight` dialect utility: expand a named or scoped weight into `fontWeight`.
//! Scoped keys (`sans.bold`) come from the ingested scale; a dotted key the family's scale misses falls back to the CSS keyword of its suffix (`mono.black` → `900`), and bare names fall back to CSS keywords (`bold` → `700`).
//! Project-specific numeric weights (393, etc.) live on `font()` fragments, not in this table.

use crate::atom::AtomValue;
use base_system::FontScale;

/// CSS weight keywords consulted when no scoped scale entry matches.
pub(crate) const CSS_WEIGHT_KEYWORDS: &[(&str, &str)] = &[
    ("thin", "100"),
    ("light", "300"),
    ("normal", "400"),
    ("semibold", "600"),
    ("bold", "700"),
    ("black", "900"),
];

/// Expand `weight="bold"` / `weight="sans.bold"` to `fontWeight`.
pub fn lower_weight(raw: &str, fonts: &FontScale) -> Vec<(Box<str>, AtomValue)> {
    // weight="bold" → 700    weight="sans.bold" → scale    weight="mono.black" → 900 (scale miss)    weight="393" → as-is
    let mapped = fonts
        .scoped_weight(raw)
        .or_else(|| css_weight_keyword(raw))
        .or_else(|| scope_suffix_keyword(raw))
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

/// CSS keyword named by the part after the first dot; a scale miss on `family.keyword` lands here.
fn scope_suffix_keyword(raw: &str) -> Option<&'static str> {
    let (_, suffix) = raw.split_once('.')?;
    css_weight_keyword(suffix)
}

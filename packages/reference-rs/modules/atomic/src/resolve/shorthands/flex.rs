//! Panda-utility value resolution for the `flex` shorthand family.
//! Maps the four single-keyword values Panda's built-in `flex` utility rewrites
//! (`1`, `auto`, `initial`, `none`) to their emitted triples; every other value
//! passes through raw. Provenance: `@pandacss/preset-base` flex utility values,
//! confirmed live against Panda 1.11.1 (core's engine, which ships no flex code
//! of its own) — including the exact-match, case-sensitive, trim-tolerant lookup.

use crate::atom::AtomValue;

/// Panda's `flex` utility values table: the four single keywords that rewrite.
pub(crate) const FLEX_KEYWORD_TRIPLES: &[(&str, &str)] = &[
    ("1", "1 1 0%"),
    ("auto", "1 1 auto"),
    ("initial", "0 1 auto"),
    ("none", "none"),
];

/// Look up one trimmed `flex` value in the keyword table above.
fn flex_keyword_triple(trimmed: &str) -> Option<&'static str> {
    // '1' → '1 1 0%'  /  'auto' → '1 1 auto'  /  'initial' → '0 1 auto'
    FLEX_KEYWORD_TRIPLES
        .iter()
        .find(|(keyword, _)| *keyword == trimmed)
        .map(|(_, triple)| *triple)
}

/// Resolve a `flex` shorthand value to its emitted declaration.
pub fn expand_flex_shorthand(prop: &str, raw_val: &str) -> Option<Vec<(Box<str>, AtomValue)>> {
    // flex: '1'  →  flex: 1 1 0%  (Panda flex utility values)
    if canon::resolve_canonical_prop(prop) != "flex" {
        return None;
    }
    let mapped = flex_keyword_triple(raw_val.trim())?;
    Some(vec![("flex".into(), AtomValue::String(mapped.into()))])
}

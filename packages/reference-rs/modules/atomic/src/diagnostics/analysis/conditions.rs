//! Runtime `when` query-shape helpers for independent diagnostics analysis.
//!
//! Classifies style-object keys as statically known or unknown and tests
//! whether an object value sits in a style-value position (responsive query)
//! or a condition position (nested `when`). Expectations always carry RAW
//! `when` strings: both key authorities key on raw strings (`AuthoredDeclaration`
//! keeps authored whens, neo `collectEntries` nests verbatim), so a static but
//! unlowerable condition such as `_hovr` still predicts an exact key (ledger
//! R2, witness P1a). `lower_when` is deliberately unused here: it lowers
//! wraps for codegen, never key bytes.

use std::collections::HashSet;

use oxc_ast::ast::PropertyKey;

use crate::extract::constants::canonical_numeric_key;

/// A style-object key as analysis sees it: a static string or unknown.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum KeyClass {
    /// The key string runtime will observe (identifiers, strings, numbers,
    /// hole-free templates). Computed keys are never static here.
    Static(String),
    /// The key cannot be known without evaluating (computed, folded, exotic).
    Unknown,
}

/// Classify one object key. Computed keys are unknown even when their
/// expression looks foldable: analysis never evaluates, it only reads.
pub fn static_key(key: &PropertyKey<'_>, computed: bool) -> KeyClass {
    if computed {
        return KeyClass::Unknown;
    }
    uncomputed_key(key)
}

/// Classify one non-computed key by its literal spelling. Templates are
/// absent: they only occur as computed keys, which are always unknown.
fn uncomputed_key(key: &PropertyKey<'_>) -> KeyClass {
    match key {
        PropertyKey::StaticIdentifier(id) => KeyClass::Static(id.name.to_string()),
        PropertyKey::StringLiteral(lit) => KeyClass::Static(lit.value.to_string()),
        PropertyKey::NumericLiteral(lit) => KeyClass::Static(canonical_numeric_key(lit.value)),
        _ => KeyClass::Unknown,
    }
}

/// True when an object value under `prop` is one responsive query instead of
/// a nested condition. Mirrors neo `collectEntries` exactly: every other key
/// shape recurses into the `when` stack.
pub fn is_style_value_position(prop: &str, style_props: &HashSet<String>) -> bool {
    prop != "r" && style_props.contains(prop)
}

#[cfg(test)]
mod tests {
    use super::super::support::{first_prop_key, parse_for_test};
    use super::*;

    fn key_class(source: &str) -> KeyClass {
        let allocator = oxc_allocator::Allocator::default();
        let program = parse_for_test(&allocator, source);
        let key = first_prop_key(&program);
        static_key(key.0, key.1)
    }

    fn style_set(names: &[&str]) -> HashSet<String> {
        names.iter().map(|name| name.to_string()).collect()
    }

    #[test]
    fn identifier_and_string_keys_are_static() {
        assert_eq!(
            key_class("css({ color: 'red' })"),
            KeyClass::Static("color".to_string())
        );
        assert_eq!(
            key_class("css({ 'font-size': '12px' })"),
            KeyClass::Static("font-size".to_string())
        );
    }

    #[test]
    fn numeric_keys_use_canonical_spelling() {
        assert_eq!(
            key_class("css({ 300: 'x' })"),
            KeyClass::Static("300".to_string())
        );
        assert_eq!(
            key_class("css({ 2.5: 'x' })"),
            KeyClass::Static("2.5".to_string())
        );
    }

    #[test]
    fn computed_keys_are_unknown() {
        assert_eq!(key_class("css({ [k]: 'red' })"), KeyClass::Unknown);
        assert_eq!(key_class("css({ ['a']: 'red' })"), KeyClass::Unknown);
        assert_eq!(key_class("css({ [`a`]: 'red' })"), KeyClass::Unknown);
        assert_eq!(key_class("css({ [`a${b}`]: 'red' })"), KeyClass::Unknown);
    }

    #[test]
    fn style_position_follows_the_runtime_set_minus_r() {
        let set = style_set(&["color", "r", "mt"]);
        assert!(is_style_value_position("color", &set));
        assert!(!is_style_value_position("r", &set));
        assert!(!is_style_value_position("_hover", &set));
        assert!(!is_style_value_position("variant", &set));
    }
}

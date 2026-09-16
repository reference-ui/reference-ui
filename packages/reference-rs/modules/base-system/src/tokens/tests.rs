//! Token dictionary unit tests for emit order, indexed dark normalization,
//! unique vs ambiguous bare names, and dual `md` / `radii.md` lookup.

use super::*;
use indexmap::IndexMap;

#[test]
fn emit_order_follows_insert_b_then_a() {
    let mut tokens = TokenDictionary::default();
    tokens.insert_leaf(TokenLeaf {
        category: "colors",
        path: "b",
        light: "1",
        dark: "1",
    });
    tokens.insert_leaf(TokenLeaf {
        category: "colors",
        path: "a",
        light: "2",
        dark: "2",
    });
    let keys: Vec<&str> = tokens.iter().map(|(key, _)| key).collect();
    assert_eq!(keys, ["colors.b", "colors.a"]);
}

#[test]
fn indexed_equal_dark_normalizes_to_none() {
    let entry: TokenEntry = serde_json::from_str(
        r#"{"category":"radii","cssVar":"--radii-md","light":"0.4rem","dark":"0.4rem"}"#,
    )
    .unwrap();
    assert_eq!(entry.light(), "0.4rem");
    assert!(entry.dark().is_none());
    let missing: TokenEntry =
        serde_json::from_str(r#"{"category":"radii","cssVar":"--radii-md","light":"0.4rem"}"#)
            .unwrap();
    assert!(missing.dark().is_none());
    let override_dark: TokenEntry = serde_json::from_str(
        r#"{"category":"colors","cssVar":"--colors-x","light":"red","dark":"navy"}"#,
    )
    .unwrap();
    assert_eq!(override_dark.dark(), Some("navy"));
}

#[test]
fn unique_bare_is_none_when_ambiguous() {
    let mut tokens = TokenDictionary::default();
    tokens.insert_leaf(TokenLeaf {
        category: "colors",
        path: "md",
        light: "red",
        dark: "navy",
    });
    tokens.insert_leaf(TokenLeaf {
        category: "radii",
        path: "md",
        light: "0.4rem",
        dark: "0.4rem",
    });
    assert!(tokens.get_unique("md").is_none());
    assert_eq!(
        tokens.get_in_category("radii", "md").map(TokenEntry::light),
        Some("0.4rem")
    );
    assert_eq!(
        tokens
            .get_in_category("colors", "md")
            .map(TokenEntry::light),
        Some("red")
    );
}

#[test]
fn authored_bare_key_and_category_path_both_resolve() {
    let mut entries = IndexMap::new();
    entries.insert(
        "md".into(),
        TokenEntry::new("radii".into(), "--radii-md".into(), "0.4rem".into(), None),
    );
    let tokens = TokenDictionary::from_entries(entries);
    assert!(tokens.get("md").is_some());
    assert!(tokens.get("radii.md").is_none());
    assert!(tokens.get_in_category("radii", "md").is_some());
    assert!(tokens.get_in_category("radii", "radii.md").is_some());
    assert!(tokens.get_unique("md").is_some());
}

#[test]
fn bas_token_06_is_private_distinguishes_internal_tokens() {
    let public_entry = TokenEntry::new("colors".into(), "--colors-brand".into(), "#111".into(), None);
    let private_entry = TokenEntry::new(
        "colors".into(),
        "--colors-_private-secret".into(),
        "#999".into(),
        None,
    );
    assert!(!public_entry.is_private());
    assert!(private_entry.is_private());
}

//! Authored-key proofs: the five-tuple lookup key a want carries, and the guard that no canonical
//! alias targets a prop the lowering matches on its authored spelling. Both pin a contract another
//! module depends on, so a regression here changes stored keys or silently skips a macro. Compiled
//! only under `cfg(test)` as a child of `resolve::tests`.

use super::*;

#[test]
fn authored_key_carries_the_five_tuple() {
    let mut when: smallvec::SmallVec<[Box<str>; 2]> = smallvec::SmallVec::new();
    when.push("_hover".into());
    let context = WantContext {
        when: when.as_slice(),
        important: true,
        backing: &crate::atom::backing::OWN,
    };
    let key = authored_key(
        "test",
        "color",
        serde_json::Value::String("red".to_string()),
        &context,
    );
    assert_eq!(key.system.as_ref(), "test");
    assert_eq!(key.when, vec![Box::<str>::from("_hover")]);
    assert_eq!(key.prop.as_ref(), "color");
    assert_eq!(key.value, serde_json::Value::String("red".to_string()));
    assert!(key.important);
    assert_eq!(
        key.lookup_key(),
        r#"["test",["_hover"],"color","red",true]"#
    );
}

/// Props matched on the authored spelling (`lower_macro`, `is_runtime_owned`,
/// the `font`/`fontFamily` bare-number exemption) rather than canonical.
const AUTHORED_MATCH_PROPS: &[&str] = &[
    "font", "weight", "container", "size", "textGradient", "border", "variant", "colorMode",
    "fontFamily",
];

#[test]
fn test_no_alias_targets_authored_match_prop() {
    // A future alias onto a macro prop would skip the macro here while a
    // canonical-keyed lowering table would apply it. Pin the gap shut.
    for alias in canon::ALIASES {
        assert!(
            !AUTHORED_MATCH_PROPS.contains(&alias.canonical),
            "alias {} targets authored-match prop {}",
            alias.alias,
            alias.canonical
        );
    }
}

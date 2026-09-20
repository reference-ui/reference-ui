/**
 * Test code emitters for Canon crate invariants and unique class prefixes.
 * Generates unit test assertions verifying that static tables are sorted lexicographically.
 * Proves that every canonical property possesses a distinct and unambiguous atomic class prefix.
 * Consumed by emit/tests/index.ts to assemble the complete tests.rs module.
 */

export function emitCanJoin04(): string {
  return `#[test]
fn can_join_04_slices_are_sorted() {
    assert!(ELEMENTS.windows(2).all(|w| w[0].html < w[1].html));
    assert!(PRIMITIVE_JSX.windows(2).all(|w| w[0] < w[1]));
    assert!(CANONICAL_PROPERTIES.windows(2).all(|w| w[0].name < w[1].name));
    assert!(ALIASES.windows(2).all(|w| w[0].alias < w[1].alias));
    assert!(REFERENCE_PROPS.windows(2).all(|w| w[0] < w[1]));
    assert!(CONDITIONS.windows(2).all(|w| w[0] < w[1]));
    assert!(COLOR_PROPERTIES.windows(2).all(|w| w[0] < w[1]));

    for el in ELEMENTS {
        assert!(
            is_primitive_jsx_name(el.jsx),
            "JSX primitive name '{}' must be found by is_primitive_jsx_name",
            el.jsx
        );
    }
}`;
}

export function emitCanJoin08(): string {
  return `#[test]
fn can_join_08_unique_class_prefixes() {
    let mut prefixes = std::collections::HashSet::new();
    for prop in CANONICAL_PROPERTIES {
        assert!(
            prefixes.insert(prop.class_prefix),
            "Duplicate class_prefix '{}' on prop '{}'",
            prop.class_prefix,
            prop.name
        );
    }
    assert_ne!(class_prefix_for_prop("display"), class_prefix_for_prop("d"));
    assert_eq!(class_prefix_for_prop("display"), "d");
    assert_eq!(class_prefix_for_prop("d"), "svg-d");
    assert_ne!(class_prefix_for_prop("zIndex"), class_prefix_for_prop("translateZ"));
    assert_eq!(class_prefix_for_prop("zIndex"), "z");
    assert_eq!(class_prefix_for_prop("translateZ"), "translate-z");
    assert_ne!(class_prefix_for_prop("boxSize"), class_prefix_for_prop("size"));
    assert_eq!(class_prefix_for_prop("boxSize"), "box-size");
    assert_eq!(class_prefix_for_prop("size"), "size");
    assert_eq!(find_property("x").unwrap().class_prefix, "svg-x");
    assert_eq!(find_property("translateX").unwrap().class_prefix, "x");
    assert_eq!(find_property("y").unwrap().class_prefix, "svg-y");
    assert_eq!(find_property("translateY").unwrap().class_prefix, "y");
}`;
}

export function emitUnrealizableGuard(): string {
  return `#[test]
fn unrealizable_extensions_table_contract() {
    assert!(UNREALIZABLE_EXTENSIONS.windows(2).all(|w| w[0] < w[1]));
    for name in UNREALIZABLE_EXTENSIONS {
        assert!(
            is_unrealizable_extension(name),
            "table member '{}' must resolve through is_unrealizable_extension",
            name
        );
    }
    // Exemptions the resolve fall-through relies on: longhand rows expand,
    // platform-shadowed rows serve platform css, platform props passthrough.
    assert!(!is_unrealizable_extension("borderStartRadius"));
    assert!(!is_unrealizable_extension("borderEndRadius"));
    assert!(!is_unrealizable_extension("webkitTextFillColor"));
    assert!(!is_unrealizable_extension("color"));
    assert!(!is_unrealizable_extension("translate"));
}`;
}

export function emitJoinTests(): string {
  return [emitCanJoin04(), emitCanJoin08(), emitUnrealizableGuard()].join('\n\n');
}

//! Property tests for [`normalize_relative_path`](crate::scanner::normalize_relative_path).

use std::path::Path;

use proptest::prelude::*;

use crate::scanner::normalize_relative_path;

proptest! {
    #![proptest_config(ProptestConfig::with_cases(256))]

    #[test]
    fn normalize_relative_path_is_idempotent(path in "[a-z/]{1,30}") {
        let p = Path::new(&path);
        let once = normalize_relative_path(p);
        let twice = normalize_relative_path(&once);
        prop_assert_eq!(once, twice);
    }

    #[test]
    fn normalize_relative_path_is_idempotent_with_dots(path in "[a-z/.]{1,30}") {
        let p = Path::new(&path);
        let once = normalize_relative_path(p);
        let twice = normalize_relative_path(&once);
        prop_assert_eq!(once, twice);
    }
}

#[test]
fn normalize_relative_path_preserves_leading_dot_dot_escapes() {
    // Regression pin (Objective 1 RS fix): leading `..` (dot-dot file ids
    // above the scan root) must survive, or barrel hops from followed
    // packages resolve to bogus in-root candidates.
    let cases = [
        (
            "../node_modules/@scope/pkg/entry/thing",
            "../node_modules/@scope/pkg/entry/thing",
        ),
        ("../node_modules/x/../y", "../node_modules/y"),
        ("a/../../b", "../b"),
        ("a/b/../../c", "c"),
        ("./x", "x"),
    ];
    for (input, expected) in cases {
        assert_eq!(
            normalize_relative_path(Path::new(input)),
            Path::new(expected),
            "input: {input}"
        );
    }
}

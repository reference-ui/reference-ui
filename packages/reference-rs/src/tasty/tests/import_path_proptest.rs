//! Property tests for [`normalize_relative_path`](crate::tasty::scanner::normalize_relative_path).

use std::path::Path;

use proptest::prelude::*;

use crate::tasty::scanner::normalize_relative_path;

proptest! {
    #![proptest_config(ProptestConfig::with_cases(256))]

    #[test]
    fn normalize_relative_path_is_idempotent(path in "[a-z/]{1,30}") {
        let p = Path::new(&path);
        let once = normalize_relative_path(p);
        let twice = normalize_relative_path(&once);
        prop_assert_eq!(once, twice);
    }
}

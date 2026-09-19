//! ModuleKey normalization: dots fold, slashes unify, keys are idempotent.
//!
//! Pins the lexical rules every ladder candidate and graph key shares, then
//! lifts tasty's normalization proptests: keying is idempotent and never
//! panics on arbitrary text.

use module_graph::ModuleKey;
use proptest::prelude::*;

#[test]
fn dots_fold_and_roots_survive() {
    assert_eq!(ModuleKey::new("/a/./b/../c").as_str(), "/a/c");
    assert_eq!(ModuleKey::new("a/b").as_str(), "a/b");
    assert_eq!(ModuleKey::new("/r/./src/tokens").as_str(), "/r/src/tokens");
}

#[test]
fn backslashes_become_slashes() {
    assert_eq!(ModuleKey::new("a\\b\\c").as_str(), "a/b/c");
}

#[test]
fn empty_and_dot_paths_settle() {
    assert_eq!(ModuleKey::new("").as_str(), ".");
    assert_eq!(ModuleKey::new(".").as_str(), ".");
    assert_eq!(ModuleKey::new("/").as_str(), "/");
}

proptest! {
    #![proptest_config(ProptestConfig::with_cases(256))]

    #[test]
    fn key_is_idempotent(path in "[a-zA-Z0-9/._-]{1,40}") {
        let once = ModuleKey::new(&path);
        prop_assert_eq!(&once, &ModuleKey::new(once.as_str()));
    }

    #[test]
    fn key_never_panics(path in "[\\s\\S]{0,80}") {
        let _ = ModuleKey::new(&path);
    }
}

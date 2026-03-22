//! Fuzz-style property test: [`extract_module_specifiers`](crate::tasty::scanner::extract_module_specifiers)
//! must not panic on arbitrary source text (Oxc parse + span walks).

use proptest::prelude::*;

use crate::tasty::scanner::extract_module_specifiers;

proptest! {
    #![proptest_config(ProptestConfig::with_cases(128))]

    /// Bounded length keeps CI time predictable; character class exercises UTF-8 and punctuation.
    #[test]
    fn extract_module_specifiers_never_panics(source in "[\\s\\S]{0,4096}") {
        let _ = extract_module_specifiers("fuzz.ts", &source);
    }
}

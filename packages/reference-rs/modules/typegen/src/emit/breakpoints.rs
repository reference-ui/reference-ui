//! Breakpoint keys a style object accepts, printed as `BreakpointKey`. The set
//! mirrors how atomic lowers a `when` token: `base` (no query), every scale
//! name (`md` prints `@container (min-width: 768px)`), and the `Down`, `Only`
//! and `<from>To<To>` ranges over the non-base names in scale order. Keys are
//! bare names, never `@md`: atomic reads an `@` key as an at-rule or selector.
//! Takes the system's breakpoint scale and emits a sorted literal set.

use base_system::BaseSystem;
use std::collections::BTreeSet;

pub(super) fn breakpoint_keys(system: &BaseSystem) -> BTreeSet<String> {
    let names: Vec<&str> = system
        .breakpoints()
        .names()
        .iter()
        .map(String::as_str)
        .filter(|name| *name != "base")
        .collect();
    let mut keys = BTreeSet::from([String::from("base")]);
    for (index, name) in names.iter().enumerate() {
        keys.insert((*name).to_string());
        keys.insert(format!("{name}Down"));
        keys.insert(format!("{name}Only"));
        for upper in &names[index + 1..] {
            keys.insert(format!("{name}To{}", capitalize(upper)));
        }
    }
    keys
}

/// `lg` → `Lg`, so `smToLg` reads as the docs spell it; atomic matches the
/// upper bound case-insensitively, and `2xl` stays `2xl`.
fn capitalize(name: &str) -> String {
    let mut chars = name.chars();
    match chars.next() {
        Some(first) => first.to_uppercase().chain(chars).collect(),
        None => String::new(),
    }
}

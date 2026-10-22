//! Breakpoint keys a style object accepts, printed as `BreakpointKey`. The set
//! mirrors how atomic lowers a `when` token: `base` (no query), every scale
//! name (`md` prints `@container (min-width: 768px)`), and the `Down`, `Only`
//! and `<from>To<To>` ranges over the non-base names in scale order. Keys are
//! bare names, never `@md`: atomic reads an `@` key as an at-rule or selector.
//! A range is printed only when base_system's range shape reads its spelling
//! back as the pair it names, so a name containing `To` or ending in `Down` or
//! `Only` never prints a key that extract drops or reads as another range.
//! Takes the system's breakpoint scale and emits a sorted literal set.

use base_system::{is_breakpoint_range_key, range_shape, BaseSystem, BreakpointScale, RangeShape};
use std::collections::BTreeSet;

pub(super) fn breakpoint_keys(system: &BaseSystem) -> BTreeSet<String> {
    let scale = system.breakpoints();
    let names: Vec<&str> = scale
        .names()
        .iter()
        .map(String::as_str)
        .filter(|name| *name != "base")
        .collect();
    let mut keys = BTreeSet::from([String::from("base")]);
    for (index, name) in names.iter().enumerate() {
        keys.insert((*name).to_string());
        let down = format!("{name}Down");
        keep_range(&mut keys, scale, down, RangeShape::Down(*name));
        let only = format!("{name}Only");
        keep_range(&mut keys, scale, only, RangeShape::Only(*name));
        for upper in &names[index + 1..] {
            let to = capitalize(upper);
            let between = format!("{name}To{to}");
            keep_range(
                &mut keys,
                scale,
                between,
                RangeShape::Between(*name, to.as_str()),
            );
        }
    }
    keys
}

/// Print a range only when extract's own test accepts it and the split reads
/// it back as the pair it was printed for. The shape test alone is not enough:
/// `aToToB` splits into two scale names, but reads as the reversed pair `a` to
/// `tob`, so the split itself must be the pair.
fn keep_range(
    keys: &mut BTreeSet<String>,
    scale: &BreakpointScale,
    key: String,
    pair: RangeShape<'_>,
) {
    if is_breakpoint_range_key(&key, scale) && range_shape(&key) == Some(pair) {
        keys.insert(key);
    }
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

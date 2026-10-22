//! Breakpoint key proofs: printed range keys read back as their pair.
//! Each range key typegen prints must read back, through the shared range shape,
//! as the forward scale pair it names, and every pair whose own spelling reads
//! back as itself must be printed. The scales name entries with `To`, a `Down` or
//! `Only` suffix, or a pair that reads in reverse: the cases where the first-`To`
//! split and the suffix arms misread a printed spelling.

use crate::emit_dts;
use base_system::{is_breakpoint_range_key, range_shape, BaseSystem, BreakpointScale, RangeShape};

/// Scales that expose the disagreement, each with declared widths. The lib-like
/// scale and the mixed-case scale are controls that must print unchanged.
const SCALES: [&[(&str, &str)]; 6] = [
    &[
        ("sm", "640"),
        ("md", "768"),
        ("lg", "1024"),
        ("xl", "1280"),
        ("2xl", "1536"),
    ],
    &[("Wide", "700"), ("tALL", "1100")],
    &[("xTo", "600"), ("y", "900")],
    &[("sm", "640"), ("wideDown", "1000"), ("lg", "1024")],
    &[("tob", "300"), ("a", "400"), ("aTo", "500"), ("b", "900")],
    &[("phoneTo", "480"), ("toTablet", "700"), ("2xl", "1536")],
];

fn system_with(pairs: &[(&str, &str)]) -> BaseSystem {
    BaseSystem {
        breakpoints: BreakpointScale::from_named_widths(pairs.iter().copied()),
        ..BaseSystem::default()
    }
}

/// The literals `BreakpointKey` prints for `system`, read back from the `.d.ts`.
fn printed_keys(system: &BaseSystem) -> Vec<String> {
    let dts = emit_dts(system);
    let union = dts
        .lines()
        .find_map(|line| line.strip_prefix("export type BreakpointKey = "))
        .expect("typegen prints BreakpointKey");
    union
        .trim_end_matches(';')
        .split('|')
        .map(|lit| lit.trim().trim_matches('\'').to_string())
        .collect()
}

/// Scale names minus `base`, in scale order: the names typegen forms ranges over.
fn non_base_names(system: &BaseSystem) -> Vec<&str> {
    system
        .breakpoints()
        .names()
        .iter()
        .map(String::as_str)
        .filter(|name| *name != "base")
        .collect()
}

/// The upper spelling typegen prints for a scale name: first letter upper-cased.
fn printed_upper(name: &str) -> String {
    let mut chars = name.chars();
    match chars.next() {
        Some(first) => first.to_uppercase().chain(chars).collect(),
        None => String::new(),
    }
}

/// The range key typegen prints for the forward pair `from` to `upper`.
fn printed_between(from: &str, upper: &str) -> String {
    format!("{from}To{}", printed_upper(upper))
}

/// True when `key` reads back, through the shared shape, as a forward pair of
/// `names` that prints to `key`: `Down` and `Only` name a scale name, and a
/// `To` range names a scale name followed by a later name's printed upper.
fn reads_back_as_printed_pair(key: &str, names: &[&str]) -> bool {
    match range_shape(key) {
        Some(RangeShape::Down(bp)) => names.contains(&bp) && key == format!("{bp}Down"),
        Some(RangeShape::Only(bp)) => names.contains(&bp) && key == format!("{bp}Only"),
        Some(RangeShape::Between(from, to)) => names.iter().enumerate().any(|(index, name)| {
            *name == from
                && names[index + 1..]
                    .iter()
                    .any(|upper| printed_upper(upper) == to)
        }),
        None => false,
    }
}

/// Why a printed key is not a range that reads back as the pair it names, or
/// `None` when it does.
fn disagreement(key: &str, system: &BaseSystem, names: &[&str]) -> Option<&'static str> {
    if !is_breakpoint_range_key(key, system.breakpoints()) {
        Some("not a range over scale names")
    } else if !reads_back_as_printed_pair(key, names) {
        Some("reads as another pair")
    } else {
        None
    }
}

/// The printed keys for one scale that are neither `base` nor a bare name, each
/// with the reason it does not read back as the pair it names.
fn disagreements_in(pairs: &[(&str, &str)]) -> Vec<String> {
    let system = system_with(pairs);
    let names = non_base_names(&system);
    printed_keys(&system)
        .into_iter()
        .filter(|key| key.as_str() != "base" && !names.contains(&key.as_str()))
        .filter_map(|key| {
            disagreement(&key, &system, &names).map(|why| format!("{key} ({pairs:?}): {why}"))
        })
        .collect()
}

/// Every printed range key, over every test scale, is a range over scale names
/// that reads back as the forward pair it names. A key that fails is a
/// disagreement: extract reads no breakpoint, or reads it as another pair.
#[test]
fn printed_range_keys_read_back_as_the_pair_they_name() {
    let disagreements: Vec<String> = SCALES
        .iter()
        .flat_map(|pairs| disagreements_in(pairs))
        .collect();
    assert!(disagreements.is_empty(), "{}", disagreements.join("\n"));
}

/// True when the forward pair `from` to `upper` prints a key that reads back as
/// that same pair.
fn reads_as_itself(from: &str, upper: &str) -> bool {
    let key = printed_between(from, upper);
    let to = printed_upper(upper);
    range_shape(&key) == Some(RangeShape::Between(from, to.as_str()))
}

/// The keys one scale must print: each name's `Down` and `Only`, and each later
/// pair that reads back as itself.
fn required_keys(pairs: &[(&str, &str)]) -> Vec<String> {
    let system = system_with(pairs);
    let names = non_base_names(&system);
    let mut required = Vec::new();
    for (index, from) in names.iter().enumerate() {
        required.push(format!("{from}Down"));
        required.push(format!("{from}Only"));
        for upper in &names[index + 1..] {
            if reads_as_itself(from, upper) {
                required.push(printed_between(from, upper));
            }
        }
    }
    required
}

/// The required keys one scale does not print, each named with its scale.
fn unprinted_in(pairs: &[(&str, &str)]) -> Vec<String> {
    let printed = printed_keys(&system_with(pairs));
    required_keys(pairs)
        .into_iter()
        .filter(|key| !printed.contains(key))
        .map(|key| format!("{key} ({pairs:?})"))
        .collect()
}

/// Every pair whose own spelling reads back as that pair is printed, so the
/// filter never drops a range atomic would resolve. `Down` and `Only` always print.
#[test]
fn pairs_that_read_back_as_themselves_are_printed() {
    let missing: Vec<String> = SCALES
        .iter()
        .flat_map(|pairs| unprinted_in(pairs))
        .collect();
    assert!(missing.is_empty(), "{}", missing.join("\n"));
}

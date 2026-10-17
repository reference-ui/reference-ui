//! Cascade sort key and shared at-rule grouping for utility rules.
//!
//! Rank is `(bucket, at-rule kind, parsed width, selector, property, ties)`.
//! At-rule magnitude is parsed from the wrap string already stored on `When`;
//! this file does not re-parse name vs wrap. Property priority comes from
//! `canon::property_cascade_rank`, never a private table. Identical wrap
//! sequences share one nested `@media` / `@container` tree; a single shared
//! wrap stays one block (LAYER-07). The first wrap is only the sort key.

use std::cmp::Ordering;

use crate::atom::{Atom, AtomSet, When, WhenKind};
use canon::{property_cascade_rank, to_css_declaration_property};
use rustc_hash::FxHashMap;

use super::name;

mod width;
mod write;

use self::width::{parse_width_key, WidthKey};
use self::write::{write_foreign_group, write_ranked};
pub(crate) use self::write::{close_wraps, open_wraps, push_indent};

const BUCKET_BASE: u8 = 0;
const BUCKET_SELECTOR: u8 = 1;
const BUCKET_AT: u8 = 2;

const AT_NONE: u8 = 0;
const AT_SUPPORTS: u8 = 1;
const AT_MEDIA: u8 = 2;
const AT_CONTAINER: u8 = 3;
const AT_PRINT: u8 = 4;
const AT_OTHER: u8 = 5;

/// Declared pseudo precedence. Sorted by name for binary search; rank is the value.
const PSEUDO_RANK: &[(&str, u8)] = &[
    ("active", 4),
    ("disabled", 5),
    ("focus", 2),
    ("focusVisible", 3),
    ("hover", 1),
];

/// Sort key for one utility. Lower sorts first. Class names are not rewritten.
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd)]
struct CascadeKey<'a> {
    bucket: u8,
    at_kind: u8,
    width: WidthKey,
    at_text: &'a str,
    selector: u8,
    property: u8,
    prop: &'a str,
    value: &'a str,
}


/// Media, container, and supports wraps in author order. Selector conditions are skipped.
/// CascadeKey sorts by the first wrap; emit walks every wrap.
pub(crate) fn at_rule_wraps(atom: &Atom) -> impl Iterator<Item = &str> {
    atom.conditions().iter().filter_map(at_wrap)
}

fn at_wrap(cond: &When) -> Option<&str> {
    match cond.wrap() {
        WhenKind::Media(query) | WhenKind::Container(query) | WhenKind::Supports(query) => {
            Some(query)
        }
        WhenKind::Selector(_) => None,
    }
}

pub(crate) fn format_declaration(atom: &Atom) -> String {
    let mut out = String::new();
    push_declaration(&mut out, atom);
    out
}

/// Push `prop: value;` directly into `out`. No temporaries.
pub(crate) fn push_declaration(out: &mut String, atom: &Atom) {
    out.push_str(to_css_declaration_property(atom.prop()));
    out.push_str(": ");
    push_escaped_value(out, atom.value().css_value_str());
    if atom.important() {
        out.push_str(" !important;");
    } else {
        out.push(';');
    }
}

/// Escape control chars in a declaration value for CSS serialization: a raw
/// newline inside a string ends the declaration and breaks selector parsers
/// downstream, so CR/LF and friends become hex escapes (`\d `). Values
/// without control chars pass through untouched.
fn push_escaped_value(out: &mut String, value: &str) {
    if !value.chars().any(|ch| ch.is_control()) {
        out.push_str(value);
        return;
    }
    for ch in value.chars() {
        if ch.is_control() {
            use std::fmt::Write as _;
            let _ = write!(out, "\\{:x} ", u32::from(ch));
        } else {
            out.push(ch);
        }
    }
}

/// Sort utilities by `CascadeKey` and emit, grouping shared at-rule wrappers.
///
/// `system` is the compiling package name. Utility selectors carry the same
/// `{system}__{stem}` segment as runtime plan class names so every plan
/// declaration matches a stylesheet rule.
pub(crate) fn write_utilities(out: &mut String, atom_set: &AtomSet, system: &str) {
    let prefix = name::SelectorPrefix::for_system(system);
    write_ranked(out, atom_set, &prefix);
}

/// Emit the own group, then one delimited group per foreign qualifier.
///
/// `qualifiers` is own-first: `qualifiers[0]` is the compiling system, so the own
/// group is byte-identical to a flat `write_utilities` call by construction. An
/// empty external set short-circuits to that flat path, so no-external bytes are
/// untouched. Otherwise the external set is ranked **once** and replayed under
/// each foreign qualifier's `SelectorPrefix`; the groups are N, one per
/// qualifier, each wrapped in `/* foreign <q> */` … `/* end foreign <q> */`
/// markers. The markers let a downstream compose strip a foreign group whole:
/// foreign rules are consumer-local (resolved with the consumer's tokens), so a
/// published entry must contribute own-qualified rules only. A foreign group is
/// uniformly non-empty whenever the external set is, so there is no per-group
/// emptiness check.
pub(crate) fn write_utilities_grouped(
    out: &mut String,
    own: &AtomSet,
    external: &AtomSet,
    qualifiers: &[String],
) {
    debug_assert!(
        !qualifiers.is_empty(),
        "grouped emission requires an own-first qualifier list"
    );
    if external.is_empty() {
        return write_utilities(out, own, &qualifiers[0]);
    }
    write_ranked(out, own, &name::SelectorPrefix::for_system(&qualifiers[0]));
    let ranked = rank_atoms(external);
    for qualifier in qualifiers.iter().skip(1) {
        write_foreign_group(out, &ranked, qualifier);
    }
}


/// Rank every atom in `atom_set` by `CascadeKey`, with the authored-when
/// tiebreak. Grouped emission ranks the external set once and replays it.
fn rank_atoms<'a>(atom_set: &'a AtomSet) -> Vec<(&'a Atom, CascadeKey<'a>)> {
    let mut ranks: FxHashMap<&'a str, u8> = FxHashMap::default();
    let mut ranked: Vec<(&'a Atom, CascadeKey<'a>)> = atom_set
        .iter()
        .map(|atom| (atom, CascadeKey::from_atom_cached(atom, &mut ranks)))
        .collect();
    ranked.sort_by(|a, b| {
        a.1.cmp(&b.1)
            .then_with(|| cmp_whens(a.0.conditions(), b.0.conditions()))
    });
    ranked
}

impl<'a> CascadeKey<'a> {
    fn from_atom_cached(atom: &'a Atom, ranks: &mut FxHashMap<&'a str, u8>) -> Self {
        let scan = scan_conditions(atom);
        let prop = atom.prop();
        let property = *ranks
            .entry(prop)
            .or_insert_with(|| property_cascade_rank(prop));
        Self {
            bucket: scan.bucket,
            at_kind: classify_at_rule(scan.first_at),
            width: parse_width_key(scan.first_at),
            at_text: scan.first_at,
            selector: scan.selector,
            property,
            prop,
            value: atom.value().css_value_str(),
        }
    }
}

/// Bucket, first at-rule wrap, and selector rank from one condition pass.
struct CondScan<'a> {
    bucket: u8,
    first_at: &'a str,
    selector: u8,
}

fn scan_conditions(atom: &Atom) -> CondScan<'_> {
    let mut bucket = BUCKET_BASE;
    let mut first_at: Option<&str> = None;
    let mut selector = 0u8;
    // The bucket is the highest kind seen, so `max` over the conditions gives at > selector > base.
    for cond in atom.conditions() {
        match cond.wrap() {
            WhenKind::Media(query) | WhenKind::Container(query) | WhenKind::Supports(query) => {
                bucket = bucket.max(BUCKET_AT);
                first_at = first_at.or(Some(query));
            }
            WhenKind::Selector(_) => {
                bucket = bucket.max(BUCKET_SELECTOR);
                selector = selector.max(pseudo_rank(cond.class_segment()));
            }
        }
    }
    CondScan {
        bucket,
        first_at: first_at.unwrap_or(""),
        selector,
    }
}



fn classify_at_rule(query: &str) -> u8 {
    if query.is_empty() {
        return AT_NONE;
    }
    if query.starts_with("@supports") {
        return AT_SUPPORTS;
    }
    if query.starts_with("@container") {
        return AT_CONTAINER;
    }
    if query.starts_with("@media") {
        return media_kind(query);
    }
    AT_OTHER
}

fn media_kind(query: &str) -> u8 {
    if is_print_query(query) {
        AT_PRINT
    } else {
        AT_MEDIA
    }
}

fn is_print_query(query: &str) -> bool {
    let Some(rest) = query.strip_prefix("@media") else {
        return false;
    };
    let rest = rest.trim_start();
    let rest = rest.strip_prefix("only ").unwrap_or(rest);
    rest == "print" || rest.starts_with("print ") || rest.starts_with("print,")
}

fn pseudo_rank(segment: &str) -> u8 {
    PSEUDO_RANK
        .binary_search_by_key(&segment, |&(name, _)| name)
        .map(|idx| PSEUDO_RANK[idx].1)
        .unwrap_or(6)
}


fn cmp_whens(a: &[When], b: &[When]) -> Ordering {
    for (left, right) in a.iter().zip(b) {
        let ord = left.authored().cmp(right.authored());
        if ord != Ordering::Equal {
            return ord;
        }
    }
    a.len().cmp(&b.len())
}

#[cfg(test)]
mod tests;

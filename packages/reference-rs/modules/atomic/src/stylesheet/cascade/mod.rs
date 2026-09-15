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

use super::name;

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

/// Size-query rank. `kind` is none/min/max; `milli` is millipx, negated for max-width.
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd)]
struct WidthKey {
    kind: u8,
    milli: i32,
}

/// First at-rule wrap. CascadeKey sorts by this; emit walks every wrap.
pub(crate) fn first_at_rule(atom: &Atom) -> Option<&str> {
    at_rule_wraps(atom).next()
}

/// Media and container wraps in author order. Selector conditions are skipped.
pub(crate) fn at_rule_wraps(atom: &Atom) -> impl Iterator<Item = &str> {
    atom.conditions().iter().filter_map(at_wrap)
}

fn at_wrap(cond: &When) -> Option<&str> {
    match cond.wrap() {
        WhenKind::Media(query) | WhenKind::Container(query) => Some(query),
        WhenKind::Selector(_) => None,
    }
}

pub(crate) fn format_declaration(atom: &Atom) -> String {
    let css_prop = to_css_declaration_property(atom.prop());
    let css_val = atom.value().css_value_str();
    if atom.important() {
        format!("{css_prop}: {css_val} !important;")
    } else {
        format!("{css_prop}: {css_val};")
    }
}

/// Sort utilities by `CascadeKey` and emit, grouping shared at-rule wrappers.
pub(crate) fn write_utilities(out: &mut String, atom_set: &AtomSet) {
    let mut ranked: Vec<(&Atom, CascadeKey<'_>)> = atom_set
        .iter()
        .map(|atom| (atom, CascadeKey::from_atom(atom)))
        .collect();
    ranked.sort_by(|a, b| {
        a.1.cmp(&b.1)
            .then(cmp_whens(a.0.conditions(), b.0.conditions()))
    });
    write_groups(out, &ranked);
}

impl<'a> CascadeKey<'a> {
    fn from_atom(atom: &'a Atom) -> Self {
        let at = first_at_rule(atom).unwrap_or("");
        Self {
            bucket: bucket(atom),
            at_kind: classify_at_rule(at),
            width: parse_width_key(at),
            at_text: at,
            selector: selector_rank(atom),
            property: property_cascade_rank(atom.prop()),
            prop: atom.prop(),
            value: atom.value().css_value_str(),
        }
    }
}

fn write_groups(out: &mut String, ranked: &[(&Atom, CascadeKey<'_>)]) {
    let mut start = 0;
    while start < ranked.len() {
        let wraps: Vec<&str> = at_rule_wraps(ranked[start].0).collect();
        let end = group_end(ranked, start, &wraps);
        write_group(out, &wraps, &ranked[start..end]);
        start = end;
    }
}

fn group_end(ranked: &[(&Atom, CascadeKey<'_>)], start: usize, wraps: &[&str]) -> usize {
    let mut end = start + 1;
    while end < ranked.len() && same_wraps(ranked[end].0, wraps) {
        end += 1;
    }
    end
}

fn same_wraps(atom: &Atom, wraps: &[&str]) -> bool {
    at_rule_wraps(atom).eq(wraps.iter().copied())
}

fn write_group(out: &mut String, wraps: &[&str], rules: &[(&Atom, CascadeKey<'_>)]) {
    open_wraps(out, wraps);
    let indent = "  ".repeat(wraps.len() + 1);
    for (atom, _) in rules {
        write_rule(out, atom, &indent);
    }
    close_wraps(out, wraps.len());
}

pub(crate) fn open_wraps(out: &mut String, wraps: &[&str]) {
    for (i, wrap) in wraps.iter().enumerate() {
        let indent = "  ".repeat(i + 1);
        out.push_str(&format!("{indent}{wrap} {{\n"));
    }
}

pub(crate) fn close_wraps(out: &mut String, count: usize) {
    for i in (0..count).rev() {
        let indent = "  ".repeat(i + 1);
        out.push_str(&format!("{indent}}}\n"));
    }
}

fn write_rule(out: &mut String, atom: &Atom, indent: &str) {
    let selector = name::selector(atom);
    let declaration = format_declaration(atom);
    out.push_str(&format!("{indent}{selector} {{ {declaration} }}\n"));
}

fn bucket(atom: &Atom) -> u8 {
    let mut has_at = false;
    let mut has_sel = false;
    for cond in atom.conditions() {
        match cond.wrap() {
            WhenKind::Media(_) | WhenKind::Container(_) => has_at = true,
            WhenKind::Selector(_) => has_sel = true,
        }
    }
    if has_at {
        BUCKET_AT
    } else if has_sel {
        BUCKET_SELECTOR
    } else {
        BUCKET_BASE
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

fn selector_rank(atom: &Atom) -> u8 {
    let mut rank = 0u8;
    for cond in atom.conditions() {
        if matches!(cond.wrap(), WhenKind::Selector(_)) {
            rank = rank.max(pseudo_rank(cond.class_segment()));
        }
    }
    rank
}

fn pseudo_rank(segment: &str) -> u8 {
    PSEUDO_RANK
        .binary_search_by_key(&segment, |&(name, _)| name)
        .map(|idx| PSEUDO_RANK[idx].1)
        .unwrap_or(6)
}

fn parse_width_key(query: &str) -> WidthKey {
    if let Some(rest) = after_feature(query, "min-width:") {
        return WidthKey {
            kind: 1,
            milli: parse_milli_px(rest).unwrap_or(0),
        };
    }
    if let Some(rest) = after_feature(query, "max-width:") {
        return WidthKey {
            kind: 2,
            milli: -parse_milli_px(rest).unwrap_or(0),
        };
    }
    WidthKey { kind: 0, milli: 0 }
}

fn after_feature<'a>(query: &'a str, feature: &str) -> Option<&'a str> {
    let idx = query.find(feature)?;
    Some(&query[idx + feature.len()..])
}

fn parse_milli_px(input: &str) -> Option<i32> {
    let s = input.trim_start();
    let (num, unit) = split_number_and_unit(s)?;
    let milli = digits_to_milli(num)?;
    scale_unit(milli, unit)
}

fn split_number_and_unit(s: &str) -> Option<(&str, &str)> {
    let digit_end = s.find(|c: char| !c.is_ascii_digit()).unwrap_or(s.len());
    if digit_end == 0 {
        return None;
    }
    let num = &s[..digit_end];
    let rest = s[digit_end..].trim_start();
    let unit_len = rest
        .find(|c: char| !c.is_ascii_alphabetic())
        .unwrap_or(rest.len());
    Some((num, &rest[..unit_len]))
}

fn digits_to_milli(num: &str) -> Option<i32> {
    num.parse::<i32>().ok()?.checked_mul(1000)
}

fn scale_unit(milli: i32, unit: &str) -> Option<i32> {
    match unit {
        "" | "px" => Some(milli),
        "em" | "rem" => milli.checked_mul(16),
        _ => Some(milli),
    }
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

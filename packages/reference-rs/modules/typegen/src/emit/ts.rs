//! Tiny TypeScript identifier and string-literal helpers for `.d.ts` printing.
//! Quote, escape, and join unions; decide whether a name can be a bare
//! identifier or must be quoted. PascalCase is for recipe type stems. These
//! helpers do not know about `BaseSystem`.

use std::collections::BTreeSet;

pub(super) fn to_pascal_case(name: &str) -> String {
    let mut out = String::new();
    let mut cap_next = true;
    for c in name.chars() {
        if !c.is_ascii_alphanumeric() {
            cap_next = true;
            continue;
        }
        if cap_next {
            out.extend(c.to_uppercase());
            cap_next = false;
        } else {
            out.push(c);
        }
    }
    out
}

pub(super) fn is_ts_ident(name: &str) -> bool {
    let mut chars = name.chars();
    let Some(first) = chars.next() else {
        return false;
    };
    is_ident_start(first) && chars.all(is_ident_continue)
}

fn is_ident_start(c: char) -> bool {
    c.is_ascii_alphabetic() || c == '_' || c == '$'
}

fn is_ident_continue(c: char) -> bool {
    c.is_ascii_alphanumeric() || c == '_' || c == '$'
}

pub(super) fn push_prop_name(out: &mut String, name: &str) {
    if is_ts_ident(name) {
        out.push_str(name);
    } else {
        out.push_str(&quote_literal(name));
    }
}

pub(super) fn join_union(lits: &BTreeSet<String>) -> String {
    let mut parts = lits.iter().map(|lit| quote_literal(lit));
    let Some(first) = parts.next() else {
        return String::from("never");
    };
    let mut out = first;
    for part in parts {
        out.push_str(" | ");
        out.push_str(&part);
    }
    out
}

pub(super) fn quote_literal(lit: &str) -> String {
    format!("'{}'", escape_ts_literal(lit))
}

fn escape_ts_literal(lit: &str) -> String {
    lit.replace('\\', "\\\\")
        .replace('\'', "\\'")
        .replace('\n', "\\n")
}

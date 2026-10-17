//! Printing of ranked utility rules: wrap-sequence groups, nested at-rule opens and closes, and selector rows.
//! `write_ranked` walks the sorted atoms and opens each shared `@media` / `@container` tree once for its group.
//! `write_foreign_group` brackets one foreign qualifier's rules with marker comments that composition later removes.

use super::{at_rule_wraps, push_declaration, rank_atoms, CascadeKey};
use crate::atom::{Atom, AtomSet};
use crate::stylesheet::name;

/// One foreign qualifier's ranked rules bounded by open/close sentinels. The
/// markers are the only bytes distinguishing a grouped build from the flat own
/// path, and they exist solely to be removed at composition.
pub(super) fn write_foreign_group(
    out: &mut String,
    ranked: &[(&Atom, CascadeKey<'_>)],
    qualifier: &str,
) {
    push_foreign_marker(out, "foreign", qualifier);
    write_groups(out, ranked, &name::SelectorPrefix::for_system(qualifier));
    push_foreign_marker(out, "end foreign", qualifier);
}

/// `  /* <label> <q> */` on its own line, indented to the utilities rules.
fn push_foreign_marker(out: &mut String, label: &str, qualifier: &str) {
    out.push_str("  /* ");
    out.push_str(label);
    out.push(' ');
    out.push_str(qualifier);
    out.push_str(" */\n");
}

/// The one shared sort+group writer: rank `atom_set`, then print its at-rule
/// groups under `prefix`. Flat and grouped emission both funnel through it, so a
/// grouped own group is structurally the flat owner's bytes.
pub(super) fn write_ranked(out: &mut String, atom_set: &AtomSet, prefix: &name::SelectorPrefix) {
    let ranked = rank_atoms(atom_set);
    write_groups(out, &ranked, prefix);
}

fn write_groups(
    out: &mut String,
    ranked: &[(&Atom, CascadeKey<'_>)],
    prefix: &name::SelectorPrefix,
) {
    let mut start = 0;
    while start < ranked.len() {
        let wraps: Vec<&str> = at_rule_wraps(ranked[start].0).collect();
        let end = group_end(ranked, start, &wraps);
        write_group(out, &wraps, &ranked[start..end], prefix);
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

fn write_group(
    out: &mut String,
    wraps: &[&str],
    rules: &[(&Atom, CascadeKey<'_>)],
    prefix: &name::SelectorPrefix,
) {
    open_wraps(out, wraps);
    let depth = wraps.len() + 1;
    for (atom, _) in rules {
        write_rule(out, atom, depth, prefix);
    }
    close_wraps(out, wraps.len());
}

pub(crate) fn open_wraps(out: &mut String, wraps: &[&str]) {
    for (i, wrap) in wraps.iter().enumerate() {
        push_indent(out, i + 1);
        out.push_str(wrap);
        out.push_str(" {\n");
    }
}

pub(crate) fn close_wraps(out: &mut String, count: usize) {
    for i in (0..count).rev() {
        push_indent(out, i + 1);
        out.push_str("}\n");
    }
}

/// Push two spaces per depth. No repeat temporary.
pub(crate) fn push_indent(out: &mut String, depth: usize) {
    for _ in 0..depth {
        out.push_str("  ");
    }
}

fn write_rule(out: &mut String, atom: &Atom, depth: usize, prefix: &name::SelectorPrefix) {
    push_indent(out, depth);
    name::push_selector_with_prefix(out, atom, prefix);
    out.push_str(" { ");
    push_declaration(out, atom);
    out.push_str(" }\n");
}

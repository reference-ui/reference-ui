//! Closed-class rule assembly shared by every recipe emission path.
//! `push_rule` resolves one class's wants through the utility resolver, sorts the atoms into the recipe cascade order (base, selector-only, at-rule), and keeps the rule only when something resolved.
//! Authored order is the final tiebreak so equal-specificity conditional atoms stay in source order.

use std::cmp::Ordering;

use super::RecipeRule;
use crate::atom::{Atom, Want, When, WhenKind};
use crate::resolve::{resolve_want_with, ResolveSession};

pub(super) fn push_rule(
    rules: &mut Vec<RecipeRule>,
    class_name: &str,
    wants: &[Want],
    session: &mut ResolveSession<'_, '_>,
) {
    let mut atoms = resolve_wants(wants, session);
    if atoms.is_empty() {
        return;
    }
    atoms.sort_by(|a, b| {
        recipe_bucket(a)
            .cmp(&recipe_bucket(b))
            .then_with(|| a.prop.cmp(&b.prop))
            .then_with(|| a.value.css_value_str().cmp(b.value.css_value_str()))
            .then_with(|| cmp_authored(&a.conditions, &b.conditions))
    });
    rules.push(RecipeRule {
        class_name: class_name.to_string(),
        atoms,
    });
}

fn resolve_wants(wants: &[Want], session: &mut ResolveSession<'_, '_>) -> Vec<Atom> {
    let mut atoms = Vec::new();
    for want in wants {
        atoms.extend(resolve_want_with(want, session));
    }
    atoms
}

/// Cascade bucket shared with the utility sorter: base, selector-only, at-rule.
fn recipe_bucket(atom: &Atom) -> u8 {
    let mut has_at = false;
    let mut has_selector = false;
    for cond in atom.conditions.iter() {
        match cond.wrap() {
            WhenKind::Media(_) | WhenKind::Container(_) | WhenKind::Supports(_) => has_at = true,
            WhenKind::Selector(_) => has_selector = true,
        }
    }
    if has_at {
        2
    } else if has_selector {
        1
    } else {
        0
    }
}

fn cmp_authored(a: &[When], b: &[When]) -> Ordering {
    for (left, right) in a.iter().zip(b.iter()) {
        let ord = left.authored().cmp(right.authored());
        if ord != Ordering::Equal {
            return ord;
        }
    }
    a.len().cmp(&b.len())
}

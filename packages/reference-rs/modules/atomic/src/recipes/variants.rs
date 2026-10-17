//! Variant-axis, compound, and responsive rule emission for closed recipes.
//! Each variant value and compound becomes one closed class whose wants resolve through the shared `push_rule` path.
//! Responsive variants repeat their wants under a breakpoint condition, printed after the plain rules so a runtime `{ base, md }` selection wins by source order.
//! `ResponsiveFilter` decides which `(axis, value, breakpoint)` triples print: open and dynamic recipes print the full matrix, observed recipes print only the observed triples.

use indexmap::IndexMap;
use rustc_hash::FxHashSet;

use super::rules::push_rule;
use super::table;
use super::{name, CompiledCompound, RecipeCompound, RecipeRule};
use crate::atom::Want;
use crate::extract::recipes::selection::{Gate, ResponsiveTriple};
use crate::resolve::ResolveSession;

pub(super) fn compile_variants(
    rules: &mut Vec<RecipeRule>,
    stem: &str,
    variants: &IndexMap<String, IndexMap<String, Vec<Want>>>,
    session: &mut ResolveSession<'_, '_>,
) -> IndexMap<String, IndexMap<String, String>> {
    let mut variant_map = IndexMap::new();
    for (key, items) in variants {
        let mut group_map = IndexMap::new();
        for (value, wants) in items {
            let class_name = name::variant_class(stem, key, value);
            push_rule(rules, &class_name, wants, session);
            group_map.insert(value.clone(), class_name);
        }
        variant_map.insert(key.clone(), group_map);
    }
    variant_map
}

/// Responsive emission filter: naming stem plus the observed triples.
/// `None` prints the full matrix (open and dynamic recipes); `Some` prints
/// only observed `(axis, value, breakpoint)` triples, in the same order.
pub(super) struct ResponsiveFilter<'a> {
    stem: &'a str,
    observed: Option<&'a FxHashSet<ResponsiveTriple>>,
}

impl<'a> ResponsiveFilter<'a> {
    /// Filter for one recipe's gate: unobserved recipes print nothing.
    pub(super) fn for_gate(stem: &'a str, gate: Gate<'a>) -> Option<Self> {
        match gate {
            Gate::Unobserved => None,
            Gate::Open => Some(Self {
                stem,
                observed: None,
            }),
            Gate::Observed(gate) if gate.dynamic => Some(Self {
                stem,
                observed: None,
            }),
            Gate::Observed(gate) => Some(Self {
                stem,
                observed: Some(&gate.responsive),
            }),
        }
    }

    /// True when this `(axis, value, breakpoint)` triple prints a rule.
    fn allows(&self, axis: &str, value: &str, breakpoint: &str) -> bool {
        match self.observed {
            None => true,
            Some(triples) => {
                if triples.is_empty() {
                    return false;
                }
                triples.contains(&(axis.to_string(), value.to_string(), breakpoint.to_string()))
            }
        }
    }
}

/// Emit one `{breakpoint}:{variant_class}` rule per width breakpoint.
///
/// Rules print after every plain variant and compound rule so a runtime
/// `{ base, md }` selection wins at width by source order. Each rule resolves
/// the same wants with the breakpoint prepended, so selector leaves (`_hover`,
/// `_disabled`) keep their descendants inside the `@container` block.
pub(super) fn compile_responsive_variants(
    rules: &mut Vec<RecipeRule>,
    variants: &IndexMap<String, IndexMap<String, Vec<Want>>>,
    session: &mut ResolveSession<'_, '_>,
    filter: &ResponsiveFilter<'_>,
) {
    let breakpoints = table::container_breakpoints(session.system.breakpoints());
    for (key, items) in variants {
        for (value, wants) in items {
            for breakpoint in &breakpoints {
                if !filter.allows(key, value, breakpoint) {
                    continue;
                }
                let class_name =
                    name::responsive_variant_class(breakpoint, filter.stem, key, value);
                let scoped = scope_wants_to_breakpoint(wants, breakpoint);
                push_rule(rules, &class_name, &scoped, session);
            }
        }
    }
}

/// Variant value class names without resolving any wants, for shaken tables.
pub(super) fn variant_class_map(
    stem: &str,
    variants: &IndexMap<String, IndexMap<String, Vec<Want>>>,
) -> IndexMap<String, IndexMap<String, String>> {
    let mut variant_map = IndexMap::new();
    for (key, items) in variants {
        let mut group_map = IndexMap::new();
        for value in items.keys() {
            group_map.insert(value.clone(), name::variant_class(stem, key, value));
        }
        variant_map.insert(key.clone(), group_map);
    }
    variant_map
}

/// Compound class names without resolving any wants, for shaken tables.
pub(super) fn compound_names(stem: &str, compounds: &[RecipeCompound]) -> Vec<CompiledCompound> {
    compounds
        .iter()
        .map(|compound| CompiledCompound {
            predicates: compound.predicates.clone(),
            class_name: name::compound_class(stem, &compound.predicates),
        })
        .collect()
}

/// Clone wants with a breakpoint condition prepended to each `when` chain.
fn scope_wants_to_breakpoint(wants: &[Want], breakpoint: &str) -> Vec<Want> {
    wants
        .iter()
        .map(|want| {
            let mut scoped = want.clone();
            scoped.when.insert(0, breakpoint.into());
            scoped
        })
        .collect()
}

pub(super) fn compile_compounds(
    rules: &mut Vec<RecipeRule>,
    stem: &str,
    compounds: &[RecipeCompound],
    session: &mut ResolveSession<'_, '_>,
) -> Vec<CompiledCompound> {
    let mut out = Vec::new();
    for compound in compounds {
        let class_name = name::compound_class(stem, &compound.predicates);
        push_rule(rules, &class_name, &compound.wants, session);
        out.push(CompiledCompound {
            predicates: compound.predicates.clone(),
            class_name,
        });
    }
    out
}

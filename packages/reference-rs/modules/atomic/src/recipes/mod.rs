//! Closed `recipe()` compilation, readable class names, and runtime tables.
//! Extracts and lowers component variant matrices into scoped `@layer recipes` rules.
//! Constructs authoritative RecipeRuntimeTable entries addressing pre-composed combinations.
//! Preserves strict layer isolation preventing recipe atoms from polluting utility want sets.

pub mod name;
mod spec;
mod table;

use indexmap::IndexMap;
use std::cmp::Ordering;

use crate::atom::{Atom, Want, When, WhenKind};
use crate::diagnostics::DiagnosticLocation;
use crate::resolve::{resolve_want_with, ResolveSession};
use crate::runtime::RecipeRuntimeTable;

pub use crate::runtime::RecipeRuntimeTable as RecipeTable;
pub use crate::runtime::{RecipeCompoundRecord, RecipeCompoundRecord as RecipeMatch};
pub use spec::from_spec;

/// Extracted recipe definition. Style wants stay here, never entering utility AtomSet.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Recipe {
    pub class_name: String,
    pub base: Vec<Want>,
    pub variants: IndexMap<String, IndexMap<String, Vec<Want>>>,
    pub default_variants: IndexMap<String, String>,
    pub compounds: Vec<RecipeCompound>,
    /// Source call site for refusal diagnostics. Empty for spec-owned recipes.
    pub location: DiagnosticLocation,
}

/// One compound variant definition matching variant predicates to style wants.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RecipeCompound {
    pub predicates: IndexMap<String, Vec<String>>,
    pub wants: Vec<Want>,
}

/// One compiled compound variant with its resolved class name.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CompiledCompound {
    pub predicates: IndexMap<String, Vec<String>>,
    pub class_name: String,
}

/// Resolved recipe ready to print and serialize as a runtime table.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CompiledRecipe {
    pub table: RecipeRuntimeTable,
    pub rules: Vec<RecipeRule>,
}

/// One closed class and the atoms that fill its declaration block.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RecipeRule {
    pub class_name: String,
    pub atoms: Vec<Atom>,
}

/// Resolve every recipe into closed classes and a RecipeRuntimeTable.
pub fn compile(
    recipes: &[Recipe],
    system_name: &str,
    session: &mut ResolveSession<'_>,
) -> Vec<CompiledRecipe> {
    recipes
        .iter()
        .map(|recipe| compile_one(recipe, system_name, session))
        .collect()
}

fn compile_one(
    recipe: &Recipe,
    system_name: &str,
    session: &mut ResolveSession<'_>,
) -> CompiledRecipe {
    let qualified_name = name::qualified_stem(system_name, &recipe.class_name);
    let base_class = name::base_class(&qualified_name);
    let mut rules = Vec::new();

    push_rule(&mut rules, &base_class, &recipe.base, session);
    let variant_map = compile_variants(&mut rules, &qualified_name, &recipe.variants, session);
    let compounds = compile_compounds(&mut rules, &qualified_name, &recipe.compounds, session);
    compile_responsive_variants(&mut rules, &qualified_name, &recipe.variants, session);

    let input = table::RecipeTableInput {
        qualified_name: &qualified_name,
        class_name: &recipe.class_name,
        variant_map: &variant_map,
        default_variants: &recipe.default_variants,
        compounds: &compounds,
        breakpoints: session.system.breakpoints(),
    };

    CompiledRecipe {
        table: table::build_shipped(&input),
        rules,
    }
}

fn compile_variants(
    rules: &mut Vec<RecipeRule>,
    stem: &str,
    variants: &IndexMap<String, IndexMap<String, Vec<Want>>>,
    session: &mut ResolveSession<'_>,
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

/// Emit one `{breakpoint}:{variant_class}` rule per width breakpoint.
///
/// Rules print after every plain variant and compound rule so a runtime
/// `{ base, md }` selection wins at width by source order. Each rule resolves
/// the same wants with the breakpoint prepended, so selector leaves (`_hover`,
/// `_disabled`) keep their descendants inside the `@container` block.
fn compile_responsive_variants(
    rules: &mut Vec<RecipeRule>,
    stem: &str,
    variants: &IndexMap<String, IndexMap<String, Vec<Want>>>,
    session: &mut ResolveSession<'_>,
) {
    let breakpoints = table::container_breakpoints(session.system.breakpoints());
    for (key, items) in variants {
        for (value, wants) in items {
            for breakpoint in &breakpoints {
                let class_name = name::responsive_variant_class(breakpoint, stem, key, value);
                let scoped = scope_wants_to_breakpoint(wants, breakpoint);
                push_rule(rules, &class_name, &scoped, session);
            }
        }
    }
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

fn compile_compounds(
    rules: &mut Vec<RecipeRule>,
    stem: &str,
    compounds: &[RecipeCompound],
    session: &mut ResolveSession<'_>,
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

fn push_rule(
    rules: &mut Vec<RecipeRule>,
    class_name: &str,
    wants: &[Want],
    session: &mut ResolveSession<'_>,
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

fn resolve_wants(wants: &[Want], session: &mut ResolveSession<'_>) -> Vec<Atom> {
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::atom::AtomValue;
    use crate::diagnostics::DiagnosticLocation;
    use base_system::BaseSystem;

    fn want(prop: &str, value: &str, when: &[&str]) -> Want {
        Want {
            prop: prop.into(),
            value: AtomValue::String(value.into()),
            when: when.iter().map(|key| (*key).into()).collect(),
            important: false,
            origin: None,
            file: None,
            line: None,
            column: None,
        }
    }

    #[test]
    fn base_atoms_sort_before_conditionals_at_equal_specificity() {
        let system = BaseSystem::lib_fixture();
        let mut diagnostics = Vec::new();
        let mut session = ResolveSession {
            system,
            diagnostics: &mut diagnostics,
            location: DiagnosticLocation::default(),
            sink: None,
            want: None,
        };
        let recipe = Recipe {
            class_name: "card".to_string(),
            base: vec![
                want("color", "blue.600", &["sm"]),
                want("color", "red.500", &[]),
            ],
            variants: IndexMap::new(),
            default_variants: IndexMap::new(),
            compounds: vec![],
            location: DiagnosticLocation::default(),
        };
        let compiled = compile(std::slice::from_ref(&recipe), "test-system", &mut session);
        assert!(diagnostics.is_empty(), "unexpected: {diagnostics:?}");
        let atoms = &compiled[0].rules[0].atoms;
        assert_eq!(atoms.len(), 2);
        assert!(atoms[0].conditions.is_empty(), "base first: {atoms:?}");
        assert!(
            !atoms[1].conditions.is_empty(),
            "conditional last: {atoms:?}"
        );
    }

    #[test]
    fn responsive_variants_emit_container_rules_after_plain_ones() {
        let system = BaseSystem::lib_fixture();
        let mut diagnostics = Vec::new();
        let mut session = ResolveSession {
            system,
            diagnostics: &mut diagnostics,
            location: DiagnosticLocation::default(),
            sink: None,
            want: None,
        };
        let mut axis = IndexMap::new();
        axis.insert(
            "solid".to_string(),
            vec![want("backgroundColor", "blue.600", &[])],
        );
        axis.insert(
            "outline".to_string(),
            vec![want("borderWidth", "1px", &["_hover"])],
        );
        let mut variants = IndexMap::new();
        variants.insert("variant".to_string(), axis);
        let recipe = Recipe {
            class_name: "buttonStyle".to_string(),
            base: vec![],
            variants,
            default_variants: IndexMap::new(),
            compounds: vec![],
            location: DiagnosticLocation::default(),
        };
        let compiled = compile(std::slice::from_ref(&recipe), "test-system", &mut session);
        assert!(diagnostics.is_empty(), "unexpected: {diagnostics:?}");
        let rules = &compiled[0].rules;
        let plain = rules
            .iter()
            .position(|rule| rule.class_name == "test-system__buttonStyle_v_outline")
            .expect("plain outline rule");
        let md = rules
            .iter()
            .position(|rule| rule.class_name == "md:test-system__buttonStyle_v_outline")
            .expect("md outline rule");
        assert!(plain < md, "responsive rules print last: {rules:?}");
        let atoms = &rules[md].atoms;
        assert!(!atoms.is_empty());
        for atom in atoms {
            assert!(
                atom.conditions
                    .iter()
                    .any(|cond| matches!(cond.wrap(), WhenKind::Container(_))),
                "container wrap missing: {atom:?}"
            );
            assert!(
                atom.conditions
                    .iter()
                    .any(|cond| matches!(cond.wrap(), WhenKind::Selector(_))),
                "hover descendant missing: {atom:?}"
            );
        }
        assert!(compiled[0].table.responsive_variant_map.is_empty());
    }
}

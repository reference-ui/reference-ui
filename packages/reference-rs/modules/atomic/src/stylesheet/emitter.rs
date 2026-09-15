//! Stylesheet rule builder and CSS layer emitter.
//! Generates valid, deterministic CSS declarations wrapped in cascade layers, selectors, and at-rules.
//! Utility rules are sorted and grouped by `cascade`; this file prints the layer shells
//! and closed recipe classes. Recipe at-rules nest the same wrap sequence as utilities.

use super::cascade::{at_rule_wraps, close_wraps, format_declaration, open_wraps, write_utilities};
use super::layers::LAYER_PREAMBLE;
use super::name;
use super::system_layers::append_system_layers;
use crate::atom::{Atom, AtomSet, WhenKind};
use crate::recipes::CompiledRecipe;
use crate::resolve::conditions::apply_selector_condition;
use base_system::BaseSystem;
use indexmap::IndexMap;

fn extract_at_rules(atom: &Atom) -> Vec<String> {
    at_rule_wraps(atom).map(str::to_string).collect()
}

/// Builds complete atomic stylesheet containing layer preambles and generated utility rules.
pub fn build_stylesheet(atom_set: &AtomSet, system: &BaseSystem) -> String {
    build_stylesheet_with(atom_set, system, &[])
}

/// Same as `build_stylesheet`, with closed recipe classes in `@layer recipes`.
pub fn build_stylesheet_with(
    atom_set: &AtomSet,
    system: &BaseSystem,
    recipes: &[CompiledRecipe],
) -> String {
    let mut out = LAYER_PREAMBLE.to_string();
    append_system_layers(&mut out, system);
    append_recipes_layer(&mut out, recipes);
    if atom_set.is_empty() {
        return out;
    }

    out.push_str("@layer utilities {\n");
    write_utilities(&mut out, atom_set);
    out.push_str("}\n");
    out
}

fn append_recipes_layer(out: &mut String, recipes: &[CompiledRecipe]) {
    if !recipes.iter().any(|recipe| !recipe.rules.is_empty()) {
        return;
    }
    out.push_str("@layer recipes {\n");
    for recipe in recipes {
        for rule in &recipe.rules {
            emit_recipe_rule(out, rule);
        }
    }
    out.push_str("}\n");
}

fn emit_recipe_rule(out: &mut String, rule: &crate::recipes::RecipeRule) {
    for group in group_recipe_atoms(rule) {
        write_recipe_group(out, &group);
    }
}

struct RecipeGroup {
    at_rules: Vec<String>,
    selector: String,
    declarations: Vec<String>,
}

fn group_recipe_atoms(rule: &crate::recipes::RecipeRule) -> Vec<RecipeGroup> {
    let mut groups: IndexMap<(Vec<String>, String), Vec<String>> = IndexMap::new();
    for atom in &rule.atoms {
        let at_rules = extract_at_rules(atom);
        let selector = recipe_selector(&rule.class_name, atom);
        groups
            .entry((at_rules, selector))
            .or_default()
            .push(format_declaration(atom));
    }
    groups
        .into_iter()
        .map(|((at_rules, selector), declarations)| RecipeGroup {
            at_rules,
            selector,
            declarations,
        })
        .collect()
}

fn recipe_selector(class_name: &str, atom: &Atom) -> String {
    let escaped = name::escape::escape_css_selector(class_name);
    let mut current = format!(".{escaped}");
    for cond in &atom.conditions {
        if let WhenKind::Selector(template) = cond.wrap() {
            current = apply_selector_condition(template, &current);
        }
    }
    current
}

fn write_recipe_group(out: &mut String, group: &RecipeGroup) {
    let decls = group.declarations.join(" ");
    let wraps: Vec<&str> = group.at_rules.iter().map(String::as_str).collect();
    open_wraps(out, &wraps);
    let indent = "  ".repeat(wraps.len() + 1);
    out.push_str(&format!("{indent}{} {{ {decls} }}\n", group.selector));
    close_wraps(out, wraps.len());
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::atom::CssValue;
    use crate::resolve::conditions::{lower_when, LoweredWhen};
    use smallvec::smallvec;

    fn empty_system() -> BaseSystem {
        BaseSystem::default()
    }

    fn when(raw: &str) -> crate::atom::When {
        match lower_when(raw, &empty_system()) {
            LoweredWhen::Known(w) => w,
            other => panic!("expected known condition for {raw}, got {other:?}"),
        }
    }

    #[test]
    fn test_empty_stylesheet() {
        let set = AtomSet::new();
        assert_eq!(build_stylesheet(&set, &empty_system()), LAYER_PREAMBLE);
    }

    #[test]
    fn test_lib_fixture_empty_atoms_still_print_tokens() {
        let css = build_stylesheet(&AtomSet::new(), BaseSystem::lib_fixture());
        assert!(css.starts_with(LAYER_PREAMBLE));
        assert!(css.contains("@layer global {"));
        assert!(css.contains("@keyframes fadeIn"));
        assert!(css.contains("@keyframes spin"));
        assert!(css.contains("@layer tokens {"));
        assert!(!css.contains("@layer utilities"));
    }

    #[test]
    fn test_unconditioned_atom_rule() {
        let mut set = AtomSet::new();
        set.insert(Atom::new(
            "marginTop".into(),
            CssValue::String("2r".into()),
            smallvec![],
            false,
        ));
        let css = build_stylesheet(&set, &empty_system());
        assert!(css.contains(".mt_2r { margin-top: 2r; }"));
    }

    #[test]
    fn test_container_query_atom_rule() {
        let mut set = AtomSet::new();
        set.insert(Atom::new(
            "marginTop".into(),
            CssValue::String("2r".into()),
            smallvec![when("@container (min-width: 640px)")],
            false,
        ));
        let css = build_stylesheet(&set, &empty_system());
        assert!(css.contains("@container (min-width: 640px)"));
        assert!(css.contains("margin-top: 2r;"));
    }
}

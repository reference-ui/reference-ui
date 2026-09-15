//! Stylesheet rule builder and CSS layer emitter.
//! Generates valid, deterministic CSS declarations wrapped in cascade layers, selectors, and at-rules.
//! `@container` wrappers on atoms are already-concrete strings from `r/`; this file prints them.
//! Closed recipe classes are printed in `@layer recipes` before utilities; empty recipes stay omitted.

use super::layers::LAYER_PREAMBLE;
use super::name;
use super::system_layers::append_system_layers;
use crate::atom::{Atom, AtomSet};
use crate::recipes::CompiledRecipe;
use crate::resolve::conditions::{apply_selector_condition, lower_condition, LoweredCondition};
use base_system::BaseSystem;
use canon::to_css_declaration_property;
use indexmap::IndexMap;

struct FormattedRule {
    selector: String,
    declaration: String,
    at_rule: Option<String>,
}

fn format_atom_declaration(atom: &Atom) -> String {
    let css_prop = to_css_declaration_property(&atom.prop);
    let css_val = atom.value.css_value_str();
    if atom.important {
        format!("{css_prop}: {css_val} !important;")
    } else {
        format!("{css_prop}: {css_val};")
    }
}

fn extract_at_rule(atom: &Atom, system: &BaseSystem) -> Option<String> {
    for cond in &atom.conditions {
        match lower_condition(cond, system) {
            LoweredCondition::Media(m) => return Some(m),
            LoweredCondition::Container(c) => return Some(c),
            LoweredCondition::Selector(_) => {}
        }
    }
    None
}

fn atom_to_rule(atom: &Atom, system: &BaseSystem) -> FormattedRule {
    FormattedRule {
        selector: name::selector(atom, system),
        declaration: format_atom_declaration(atom),
        at_rule: extract_at_rule(atom, system),
    }
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
    append_recipes_layer(&mut out, recipes, system);
    if atom_set.is_empty() {
        return out;
    }

    out.push_str("@layer utilities {\n");

    let mut direct_rules = Vec::new();
    let mut at_rules = Vec::new();

    for atom in atom_set {
        let rule = atom_to_rule(atom, system);
        if rule.at_rule.is_some() {
            at_rules.push(rule);
        } else {
            direct_rules.push(rule);
        }
    }

    direct_rules.sort_by(|a, b| a.selector.cmp(&b.selector));
    for rule in direct_rules {
        out.push_str(&format!("  {} {{ {} }}\n", rule.selector, rule.declaration));
    }

    at_rules.sort_by(|a, b| {
        let at_a = a.at_rule.as_deref().unwrap_or("");
        let at_b = b.at_rule.as_deref().unwrap_or("");
        at_a.cmp(at_b).then_with(|| a.selector.cmp(&b.selector))
    });

    for rule in at_rules {
        let at_rule_head = rule.at_rule.as_deref().unwrap_or("");
        out.push_str(&format!(
            "  {at_rule_head} {{\n    {} {{ {} }}\n  }}\n",
            rule.selector, rule.declaration
        ));
    }

    out.push_str("}\n");
    out
}

fn append_recipes_layer(out: &mut String, recipes: &[CompiledRecipe], system: &BaseSystem) {
    if !recipes.iter().any(|recipe| !recipe.rules.is_empty()) {
        return;
    }
    out.push_str("@layer recipes {\n");
    for recipe in recipes {
        for rule in &recipe.rules {
            emit_recipe_rule(out, rule, system);
        }
    }
    out.push_str("}\n");
}

fn emit_recipe_rule(out: &mut String, rule: &crate::recipes::RecipeRule, system: &BaseSystem) {
    for group in group_recipe_atoms(rule, system) {
        write_recipe_group(out, &group);
    }
}

struct RecipeGroup {
    at_rule: Option<String>,
    selector: String,
    declarations: Vec<String>,
}

fn group_recipe_atoms(
    rule: &crate::recipes::RecipeRule,
    system: &BaseSystem,
) -> Vec<RecipeGroup> {
    let mut groups: IndexMap<(Option<String>, String), Vec<String>> = IndexMap::new();
    for atom in &rule.atoms {
        let at_rule = extract_at_rule(atom, system);
        let selector = recipe_selector(&rule.class_name, atom, system);
        groups
            .entry((at_rule, selector))
            .or_default()
            .push(format_atom_declaration(atom));
    }
    groups
        .into_iter()
        .map(|((at_rule, selector), declarations)| RecipeGroup {
            at_rule,
            selector,
            declarations,
        })
        .collect()
}

fn recipe_selector(class_name: &str, atom: &Atom, system: &BaseSystem) -> String {
    let escaped = name::escape::escape_css_selector(class_name);
    let mut current = format!(".{escaped}");
    for cond in &atom.conditions {
        if let LoweredCondition::Selector(template) = lower_condition(cond, system) {
            current = apply_selector_condition(&template, &current);
        }
    }
    current
}

fn write_recipe_group(out: &mut String, group: &RecipeGroup) {
    let decls = group.declarations.join(" ");
    if let Some(at_rule) = &group.at_rule {
        out.push_str(&format!(
            "  {at_rule} {{\n    {} {{ {decls} }}\n  }}\n",
            group.selector
        ));
    } else {
        out.push_str(&format!("  {} {{ {decls} }}\n", group.selector));
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::atom::AtomValue;
    use smallvec::smallvec;

    fn empty_system() -> BaseSystem {
        BaseSystem::default()
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
        assert!(css.contains("@layer tokens {"));
        assert!(!css.contains("@layer utilities"));
    }

    #[test]
    fn test_unconditioned_atom_rule() {
        let mut set = AtomSet::new();
        set.insert(Atom::new(
            "marginTop".into(),
            AtomValue::String("2r".into()),
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
            AtomValue::String("2r".into()),
            smallvec!["@container (min-width: 640px)".into()],
            false,
        ));
        let css = build_stylesheet(&set, &empty_system());
        assert!(css.contains("@container (min-width: 640px)"));
        assert!(css.contains("margin-top: 2r;"));
    }
}

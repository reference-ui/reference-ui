//! Stylesheet rule builder and CSS layer emitter.
//! Generates valid, deterministic CSS declarations wrapped in cascade layers, selectors, and at-rules.
//! Utility rules are sorted and grouped by `cascade`; this file prints the layer shells
//! and closed recipe classes. Recipe at-rules nest the same wrap sequence as utilities.

use super::cascade::{at_rule_wraps, close_wraps, format_declaration, open_wraps, write_utilities};
use super::layers::{wrap_package_layer, LAYER_PREAMBLE};
use super::name;
use super::system_layers::{append_portable_system_layers, append_system_layers};
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
///
/// Named systems nest the six layers inside their package layer so composed
/// output keeps utilities above global; unnamed systems stay flat.
pub fn build_stylesheet_with(
    atom_set: &AtomSet,
    system: &BaseSystem,
    recipes: &[CompiledRecipe],
) -> String {
    let mut inner = LAYER_PREAMBLE.to_string();
    append_system_layers(&mut inner, system);
    append_recipes_layer(&mut inner, recipes);
    append_utilities_layer(&mut inner, atom_set, &system.name);
    wrap_package_layer(&system.name, &inner)
}

/// Same as `build_stylesheet_with`, with portable [data-layer] token selectors.
pub fn build_portable_stylesheet_with(
    atom_set: &AtomSet,
    system: &BaseSystem,
    recipes: &[CompiledRecipe],
) -> String {
    let mut inner = LAYER_PREAMBLE.to_string();
    append_portable_system_layers(&mut inner, system);
    append_recipes_layer(&mut inner, recipes);
    append_utilities_layer(&mut inner, atom_set, &system.name);
    wrap_package_layer(&system.name, &inner)
}

fn append_utilities_layer(out: &mut String, atom_set: &AtomSet, system: &str) {
    if atom_set.is_empty() {
        return;
    }
    out.push_str("@layer utilities {\n");
    write_utilities(out, atom_set, system);
    out.push_str("}\n");
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
    let groups = group_recipe_atoms(rule);
    let mut start = 0;
    while start < groups.len() {
        let mut end = start + 1;
        while end < groups.len() && groups[end].at_rules == groups[start].at_rules {
            end += 1;
        }
        write_recipe_block(out, &groups[start..end]);
        start = end;
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
    let base_selector = format!(".{}", name::escape::escape_css_selector(&rule.class_name));
    let mut ordered: Vec<RecipeGroup> = groups
        .into_iter()
        .map(|((at_rules, selector), declarations)| RecipeGroup {
            at_rules,
            selector,
            declarations,
        })
        .collect();
    ordered.sort_by(|a, b| {
        group_bucket(a, &base_selector)
            .cmp(&group_bucket(b, &base_selector))
            .then_with(|| first_wrap_kind(&a.at_rules).cmp(&first_wrap_kind(&b.at_rules)))
            .then_with(|| first_wrap_width(&a.at_rules).cmp(&first_wrap_width(&b.at_rules)))
            .then_with(|| a.at_rules.cmp(&b.at_rules))
            .then_with(|| a.selector.cmp(&b.selector))
    });
    ordered
}

/// Cascade bucket for one recipe group: base, selector-only, at-rule.
fn group_bucket(group: &RecipeGroup, base_selector: &str) -> u8 {
    if !group.at_rules.is_empty() {
        2
    } else if group.selector != base_selector {
        1
    } else {
        0
    }
}

fn first_wrap_kind(wraps: &[String]) -> u8 {
    wraps.first().map(|wrap| classify_wrap(wrap)).unwrap_or(0)
}

/// At-rule kind rank shared with the utility sorter: supports, media, container.
fn classify_wrap(query: &str) -> u8 {
    if query.starts_with("@supports") {
        1
    } else if query.starts_with("@media") {
        2
    } else if query.starts_with("@container") {
        3
    } else {
        4
    }
}

fn first_wrap_width(wraps: &[String]) -> (u8, i32) {
    wraps
        .first()
        .map(|wrap| width_key(wrap))
        .unwrap_or_default()
}

fn width_key(query: &str) -> (u8, i32) {
    if let Some(rest) = after_feature(query, "min-width:") {
        return (1, milli_px(rest));
    }
    if let Some(rest) = after_feature(query, "max-width:") {
        return (2, -milli_px(rest));
    }
    (0, 0)
}

fn after_feature<'a>(query: &'a str, feature: &str) -> Option<&'a str> {
    let idx = query.find(feature)?;
    Some(&query[idx + feature.len()..])
}

fn milli_px(input: &str) -> i32 {
    let text = input.trim_start();
    let end = text
        .find(|c: char| !c.is_ascii_digit())
        .unwrap_or(text.len());
    let num: i32 = text[..end].parse().unwrap_or(0);
    let unit = text[end..].trim_start();
    let milli = num.saturating_mul(1000);
    if unit.starts_with("em") || unit.starts_with("rem") {
        milli.saturating_mul(16)
    } else {
        milli
    }
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

/// Print consecutive same-wrap groups inside one at-rule block.
///
/// Groups arrive sorted so equal wraps are adjacent; merging keeps one
/// rule's base selector and its condition descendants in a single block,
/// mirroring the utility writer. Unwrapped groups print unchanged.
fn write_recipe_block(out: &mut String, groups: &[RecipeGroup]) {
    let Some(first) = groups.first() else {
        return;
    };
    let wraps: Vec<&str> = first.at_rules.iter().map(String::as_str).collect();
    open_wraps(out, &wraps);
    let indent = "  ".repeat(wraps.len() + 1);
    for group in groups {
        let decls = group.declarations.join(" ");
        out.push_str(&format!("{indent}{} {{ {decls} }}\n", group.selector));
    }
    close_wraps(out, wraps.len());
}

#[cfg(test)]
#[path = "emitter_ordering_tests.rs"]
mod emitter_ordering_tests;

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
        assert!(css.starts_with("@layer \\@reference-ui\\/lib {\n"));
        assert!(css.contains(LAYER_PREAMBLE));
        assert!(css.contains("@layer global {"));
        assert!(css.contains("@keyframes fadeIn"));
        assert!(css.contains("@keyframes spin"));
        assert!(css.contains("@layer tokens {"));
        assert!(!css.contains("@layer utilities"));
        assert!(css.ends_with("}\n"));
    }

    #[test]
    fn test_named_system_nests_internal_layers_in_package() {
        let mut set = AtomSet::new();
        set.insert(Atom::new(
            "color".into(),
            CssValue::String("blue.600".into()),
            smallvec![],
            false,
        ));
        let css = build_stylesheet(&set, BaseSystem::lib_fixture());
        let package = css
            .find("@layer \\@reference-ui\\/lib {")
            .expect("package open");
        let global = css.find("@layer global {").expect("global block");
        let utilities = css.find("@layer utilities {").expect("utilities block");
        assert!(package < global && global < utilities);
        assert!(css.ends_with("}\n"));
        let portable = build_portable_stylesheet_with(&set, BaseSystem::lib_fixture(), &[]);
        assert!(portable.starts_with("@layer \\@reference-ui\\/lib {\n"));
        assert!(portable.ends_with("}\n"));
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

    #[test]
    fn test_utility_selectors_carry_system_segment() {
        let mut set = AtomSet::new();
        set.insert(Atom::new(
            "color".into(),
            CssValue::String("blue.600".into()),
            smallvec![],
            false,
        ));
        let system = BaseSystem::lib_fixture();
        let css = build_stylesheet(&set, system);
        assert!(css.contains(".\\@reference-ui\\/lib__c_blue\\.600"));
        let portable = build_portable_stylesheet_with(&set, system, &[]);
        assert!(portable.contains(".\\@reference-ui\\/lib__c_blue\\.600"));
    }

    #[test]
    fn test_every_plan_class_name_matches_a_stylesheet_selector() {
        use crate::runtime::{AuthoredDeclaration, PlanBuilder};
        use serde_json::json;

        let system = BaseSystem::lib_fixture();
        let decls = vec![
            AuthoredDeclaration {
                when: vec![],
                prop: "color".to_string(),
                value: json!("blue.600"),
                important: false,
            },
            AuthoredDeclaration {
                when: vec!["_hover".to_string()],
                prop: "color".to_string(),
                value: json!("red.500"),
                important: false,
            },
        ];
        let mut atom_set = AtomSet::new();
        let mut diagnostics = Vec::new();
        let mut builder = PlanBuilder::new(&system.name, system, &mut atom_set, &mut diagnostics);
        let plans = builder.build(&decls);
        assert_eq!(plans.len(), 2);

        let css = build_stylesheet(&atom_set, system);
        for plan in &plans {
            for decl in &plan.declarations {
                let escaped = name::escape::escape_css_selector(&decl.class_name);
                assert!(
                    css.contains(&format!(".{escaped}")),
                    "plan class {} missing from sheet:\n{css}",
                    decl.class_name
                );
            }
        }
    }
}

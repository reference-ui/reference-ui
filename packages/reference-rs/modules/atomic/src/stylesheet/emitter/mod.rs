//! Stylesheet rule builder and CSS layer emitter.
//! Generates valid, deterministic CSS declarations wrapped in cascade layers, selectors, and at-rules.
//! Utility rules are sorted and grouped by `cascade`; this file prints the layer shells
//! and closed recipe classes. Recipe at-rules nest the same wrap sequence as utilities.

use super::cascade::{
    at_rule_wraps, close_wraps, format_declaration, open_wraps, push_indent, write_utilities,
};
use super::layers::{wrap_package_layer, LAYER_PREAMBLE};
use super::name;
use super::system_layers::{append_portable_system_layers, append_system_layers};
use crate::atom::{Atom, AtomSet, WhenKind};
use crate::recipes::CompiledRecipe;
use crate::resolve::conditions::nest_selector_condition;
use base_system::BaseSystem;
use indexmap::IndexMap;

fn extract_at_rules(atom: &Atom) -> Vec<String> {
    at_rule_wraps(atom).map(str::to_string).collect()
}

/// Builds complete atomic stylesheet containing layer preambles and generated utility rules.
pub fn build_stylesheet(
    atom_set: &AtomSet,
    system: &BaseSystem,
    diagnostics: &mut Vec<crate::diagnostics::Diagnostic>,
) -> String {
    build_stylesheet_with(atom_set, system, &[], diagnostics)
}

/// Same as `build_stylesheet`, with closed recipe classes in `@layer recipes`.
///
/// Named systems nest the six layers inside their package layer so composed
/// output keeps utilities above global; unnamed systems stay flat.
pub fn build_stylesheet_with(
    atom_set: &AtomSet,
    system: &BaseSystem,
    recipes: &[CompiledRecipe],
    diagnostics: &mut Vec<crate::diagnostics::Diagnostic>,
) -> String {
    let mut inner = LAYER_PREAMBLE.to_string();
    append_system_layers(&mut inner, system, diagnostics);
    append_recipes_layer(&mut inner, recipes);
    append_utilities_layer(&mut inner, atom_set, &system.name);
    wrap_package_layer(&system.name, &inner)
}

/// Same as `build_stylesheet_with`, with portable [data-layer] token selectors.
pub fn build_portable_stylesheet_with(
    atom_set: &AtomSet,
    system: &BaseSystem,
    recipes: &[CompiledRecipe],
    diagnostics: &mut Vec<crate::diagnostics::Diagnostic>,
) -> String {
    let mut inner = LAYER_PREAMBLE.to_string();
    append_portable_system_layers(&mut inner, system, diagnostics);
    append_recipes_layer(&mut inner, recipes);
    append_utilities_layer(&mut inner, atom_set, &system.name);
    wrap_package_layer(&system.name, &inner)
}

/// Paired diagnostic sinks for the dual-sheet build. The primary sink is kept;
/// the portable sink is dropped by the caller so global warnings surface once.
pub struct StylesheetSinks<'a> {
    pub primary: &'a mut Vec<crate::diagnostics::Diagnostic>,
    pub portable: &'a mut Vec<crate::diagnostics::Diagnostic>,
}

/// Build both sheets sharing one recipes+utilities suffix. Only the system
/// layers differ (token selectors), so the suffix sorts and prints once and
/// both sheets stay byte-identical to the paired single builds.
pub fn build_stylesheets_with(
    atom_set: &AtomSet,
    system: &BaseSystem,
    recipes: &[CompiledRecipe],
    sinks: StylesheetSinks<'_>,
) -> (String, String) {
    let shared = shared_layers(atom_set, system, recipes);
    let mut inner = LAYER_PREAMBLE.to_string();
    append_system_layers(&mut inner, system, sinks.primary);
    inner.reserve(shared.len());
    inner.push_str(&shared);
    let stylesheet = wrap_package_layer(&system.name, &inner);
    let mut portable_inner = LAYER_PREAMBLE.to_string();
    append_portable_system_layers(&mut portable_inner, system, sinks.portable);
    portable_inner.reserve(shared.len());
    portable_inner.push_str(&shared);
    let portable_stylesheet = wrap_package_layer(&system.name, &portable_inner);
    (stylesheet, portable_stylesheet)
}

/// Recipes + utilities layers, identical in both sheets; sorted and printed once.
fn shared_layers(
    atom_set: &AtomSet,
    system: &BaseSystem,
    recipes: &[CompiledRecipe],
) -> String {
    let mut shared = String::with_capacity(shared_capacity(atom_set));
    append_recipes_layer(&mut shared, recipes);
    append_utilities_layer(&mut shared, atom_set, &system.name);
    shared
}

/// Pre-size the shared layers buffer: ~128 bytes per utility rule covers the
/// selector, declaration, indent, and wrap lines with room to spare, so the
/// per-atom pushes below never regrow. Overshoot is one transient allocation.
fn shared_capacity(atom_set: &AtomSet) -> usize {
    atom_set.len().saturating_mul(128).saturating_add(1024)
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
            current = nest_selector_condition(&current, template);
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
    let depth = wraps.len() + 1;
    for group in groups {
        let decls = group.declarations.join(" ");
        push_indent(out, depth);
        out.push_str(&group.selector);
        out.push_str(" { ");
        out.push_str(&decls);
        out.push_str(" }\n");
    }
    close_wraps(out, wraps.len());
}

#[cfg(test)]
mod emitter_ordering_tests;

#[cfg(test)]
mod tests;
